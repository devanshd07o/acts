import os
from django.contrib.auth.models import User
from django.db.models import Count, Avg
from django.db import transaction
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Complaint,
    ComplaintCluster,
    MaintenanceCrew,
    ComplaintStatus,
    Notification,
    DepartmentType
)
from .serializers import (
    ComplaintSerializer,
    ComplaintCreateSerializer,
    ComplaintDetailSerializer,
    ComplaintClusterSerializer,
    MaintenanceCrewSerializer,
    ComplaintConfirmSerializer,
    PriorityOverrideSerializer,
    NotificationSerializer
)
from .services import (
    validate_image_clarity,
    detect_civic_defects,
    analyze_civic_issue,
    map_to_department,
    compress_image,
    cluster_and_weight_complaint,
    calculate_crowd_priority,
    dispatch_cluster_to_crew,
    evaluate_submission_trust,
    adjust_user_trust_score
)

class HealthCheckView(APIView):
    """Health check endpoint for Docker containers and frontend connectivity."""
    def get(self, request):
        return Response({
            "status": "healthy",
        }, status=status.HTTP_200_OK)


from .models import (
    Complaint,
    ComplaintCluster,
    MaintenanceCrew,
    Notification,
    UserProfile,
    DepartmentType,
    ComplaintStatus
)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        full_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        email = request.user.email or (f"{request.user.username}@abesec.ac.in" if '@' not in request.user.username else request.user.username)
        return Response({
            "username": request.user.username,
            "full_name": full_name,
            "email": email,
            "is_admin": request.user.is_staff,
            "role": profile.role if profile else ('admin' if request.user.is_staff else 'student'),
            "roll_no": profile.roll_no if profile else '',
            "employee_id": profile.employee_id if profile else '',
            "department": profile.department if profile else 'General',
            "designation": profile.designation if profile else '',
            "is_verified": profile.is_verified if profile else True
        })


class CitizenRegisterView(APIView):
    permission_classes = []

    @transaction.atomic
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        email = request.data.get('email', '').strip()
        full_name = request.data.get('full_name', '').strip()
        role = request.data.get('role', 'student').strip().lower()
        roll_no = request.data.get('roll_no', '').strip()
        employee_id = request.data.get('employee_id', '').strip()
        department = request.data.get('department', 'General').strip()
        designation = request.data.get('designation', '').strip()

        if not username or not password:
            return Response({"detail": "Institutional username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 6:
            return Response({"detail": "Password must be at least 6 characters long."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"detail": f"An account with ID '{username}' already exists. Please sign in."}, status=status.HTTP_400_BAD_REQUEST)

        # Institutional verification & anti-impersonation rules
        if role == 'student':
            if not roll_no:
                roll_no = username if username.isalnum() and len(username) >= 5 else ''
            if not roll_no:
                return Response({"detail": "Valid Student University Roll Number is required for verification."}, status=status.HTTP_400_BAD_REQUEST)
            if len(roll_no) < 5:
                return Response({"detail": "University Roll Number must contain at least 5 alphanumeric characters."}, status=status.HTTP_400_BAD_REQUEST)
        elif role in ['admin', 'faculty']:
            if not employee_id:
                employee_id = username if any(p in username.upper() for p in ['EMP', 'FAC', 'ADM', 'STAFF']) else ''
            if not employee_id or len(employee_id) < 4:
                return Response({
                    "detail": "Authorized College Employee/Faculty ID code (e.g. EMP-2041, FAC-CS-101) is required for staff access."
                }, status=status.HTTP_400_BAD_REQUEST)

        first_name = full_name.split(' ')[0] if full_name else ''
        last_name = ' '.join(full_name.split(' ')[1:]) if (full_name and len(full_name.split(' ')) > 1) else ''

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        is_admin = (role in ['admin', 'faculty'] or 'admin' in username.lower())
        user.is_staff = is_admin
        user.save()

        # Create or update verified UserProfile
        profile, _ = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'role': role,
                'roll_no': roll_no,
                'employee_id': employee_id,
                'department': department or ('Operations' if is_admin else 'Engineering'),
                'designation': designation or ('Campus Administrator' if is_admin else 'Enrolled Student'),
                'is_verified': True
            }
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            "detail": "Verified institutional account registered successfully.",
            "username": user.username,
            "full_name": full_name or user.username,
            "email": user.email,
            "role": profile.role,
            "roll_no": profile.roll_no,
            "employee_id": profile.employee_id,
            "department": profile.department,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_admin": user.is_staff
        }, status=status.HTTP_201_CREATED)


class GoogleOAuthBridgeView(APIView):
    """
    Exchanges Google profile info (email, full_name, role) for a valid Django JWT pair.
    Creates or retrieves the campus User, guaranteeing persistent JWT session without random logouts.
    """
    permission_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        full_name = request.data.get('full_name', '').strip()
        role = request.data.get('role', 'student').strip().lower()
        roll_no = request.data.get('roll_no', '').strip()
        employee_id = request.data.get('employee_id', '').strip()
        department = request.data.get('department', '').strip()

        if not email:
            return Response({"detail": "Google email is required."}, status=status.HTTP_400_BAD_REQUEST)

        username = email.split('@')[0].replace('.', '_').replace('-', '_')
        user = User.objects.filter(email=email).first() or User.objects.filter(username=username).first()

        if not user:
            first_name = full_name.split(' ')[0] if full_name else username
            last_name = ' '.join(full_name.split(' ')[1:]) if (full_name and len(full_name.split(' ')) > 1) else ''
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            user.set_unusable_password()

        is_admin = (role == 'admin' or 'admin' in username.lower() or 'admin' in email.lower() or 'faculty' in email.lower())
        if is_admin and not user.is_staff:
            user.is_staff = True
            user.save()

        # Update profile
        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'role': 'admin' if user.is_staff else 'student',
                'roll_no': roll_no,
                'employee_id': employee_id,
                'department': department or 'Campus Community',
                'is_verified': True
            }
        )

        refresh = RefreshToken.for_user(user)
        display_name = f"{user.first_name} {user.last_name}".strip() or user.username
        profile = getattr(user, 'profile', None)
        return Response({
            "detail": "Google session verified and JWT issued.",
            "username": user.username,
            "full_name": display_name,
            "email": user.email,
            "role": profile.role if profile else ('admin' if user.is_staff else 'student'),
            "roll_no": profile.roll_no if profile else '',
            "employee_id": profile.employee_id if profile else '',
            "department": profile.department if profile else '',
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_admin": user.is_staff
        }, status=status.HTTP_200_OK)


from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class ReportIssueView(APIView):
    """
    Report Civic Issue View with JWT Authentication & ML Triage Pipeline:
    - Enforces IsAuthenticated (JWT) or Guest Citizen submission.
    - Rate limited via AnonRateThrottle & UserRateThrottle.
    - Accepts multipart form data (image, citizen_description/raw_text, latitude, longitude, campus_zone, address).
    - Ties the issue and uploaded image to request.user.
    - Runs YOLO defect detection & Gemini Multimodal AI triage services.
    - Saves all AI results (detected_class, yolo_confidence, severity_score, assigned_department, is_emergency, ai_summary) to the database.
    - Merges report into crowd cluster and dispatches to nearest crew.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = []
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        image_file = request.FILES.get('image')
        if image_file and image_file.size > 15 * 1024 * 1024:
            return Response({"image": ["Image file exceeds maximum allowable size (15MB)."]}, status=status.HTTP_400_BAD_REQUEST)

        # Validate writable user fields via ComplaintSerializer
        serializer = ComplaintSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Tie complaint to authenticated user if logged in, else guest citizen
        user = request.user if request.user and request.user.is_authenticated else None
        user_identifier = (user.username if user else None) or request.data.get('user_identifier') or 'citizen_mobile'
        complaint = serializer.save(
            user=user,
            user_identifier=user_identifier
        )

        # Ensure citizen_description and raw_text are in sync
        description_text = complaint.citizen_description or complaint.raw_text or request.data.get('raw_text', '') or request.data.get('citizen_description', '')
        complaint.citizen_description = description_text
        complaint.raw_text = description_text

        # 1. Computer Vision Validation & Compression
        if image_file:
            is_clear, blur_score = validate_image_clarity(image_file)
            compressed_file = compress_image(image_file)
            complaint.is_valid_image = is_clear
            complaint.blur_score = blur_score
            if compressed_file:
                complaint.compressed_image = compressed_file
            complaint.save()

        # 2. YOLO Defect Detection
        image_path = None
        if complaint.image and hasattr(complaint.image, 'path') and os.path.exists(complaint.image.path):
            image_path = complaint.image.path
        elif complaint.compressed_image and hasattr(complaint.compressed_image, 'path') and os.path.exists(complaint.compressed_image.path):
            image_path = complaint.compressed_image.path

        detected_class = ''
        yolo_confidence = 0.0
        if image_path:
            yolo_result = detect_civic_defects(image_path)
            complaint.yolo_detections = yolo_result
            detections = yolo_result.get('detections', [])
            if detections and isinstance(detections, list) and len(detections) > 0:
                detected_class = detections[0].get('label', '')
                yolo_confidence = float(detections[0].get('confidence', 0.0))

        # 3. Gemini Multimodal / Text Triage
        gemini_result = analyze_civic_issue(raw_text=description_text, image_path=image_path)
        complaint.gemini_analysis = gemini_result

        # Parse Gemini results
        severity_score = 5
        if "severity_score" in gemini_result and isinstance(gemini_result["severity_score"], (int, float)):
            severity_score = int(gemini_result["severity_score"])

        assigned_dept = gemini_result.get('department', 'GENERAL')
        if assigned_dept not in DepartmentType.values:
            assigned_dept = map_to_department(assigned_dept or 'GENERAL')

        urgency = str(gemini_result.get('urgency', '')).upper()
        is_emergency = (urgency in ['HIGH', 'CRITICAL'] or gemini_result.get('is_emergency') is True or severity_score >= 8)
        ai_summary = gemini_result.get('summary', '') or gemini_result.get('title', '')

        # 4. Save AI results directly to Complaint database columns
        complaint.detected_class = detected_class
        complaint.yolo_confidence = yolo_confidence
        complaint.severity_score = severity_score
        complaint.assigned_department = assigned_dept
        complaint.is_emergency = is_emergency
        complaint.ai_summary = ai_summary

        # Keep legacy compatibility fields aligned
        complaint.department = assigned_dept
        complaint.initial_severity = severity_score

        # 5. Trust Evaluation + Gemini Gating
        # If Gemini flags low confidence OR image is invalid → PENDING_VERIFICATION (manual review).
        # If Gemini confirms issue (score >= 4 and valid image or no image) → normal QUEUED flow.
        gemini_confident = (
            complaint.is_valid_image  # image passes blur check
            and severity_score >= 4   # meaningful severity
            and urgency not in ['', 'UNKNOWN', 'LOW']  # Gemini saw something
        ) if image_file else (severity_score >= 4)  # text-only: trust if severity reasonable

        if not gemini_confident:
            complaint.status = ComplaintStatus.PENDING_VERIFICATION
            complaint.admin_notes = (
                f"Auto-flagged for manual review: "
                f"severity={severity_score}, urgency={urgency}, "
                f"is_valid_image={complaint.is_valid_image}"
            )
            complaint.save()
            response_serializer = ComplaintSerializer(complaint, context={'request': request})
            return Response({
                "message": "Complaint submitted. Pending manual verification before triage.",
                "status": "PENDING_VERIFICATION",
                "is_new_cluster": False,
                "crowd_report_count": 1,
                "computed_priority": float(severity_score),
                "cluster_id": None,
                "complaint": response_serializer.data,
            }, status=status.HTTP_201_CREATED)

        initial_status = evaluate_submission_trust(complaint.user_trust_score)
        complaint.status = initial_status
        complaint.save()

        # 6. Crowd-Weighted Clustering & Smart Crew Dispatch
        cluster, is_new = cluster_and_weight_complaint(complaint)
        complaint.cluster = cluster
        complaint.save(update_fields=["cluster"])

        if not cluster.assigned_crew:
            dispatch_cluster_to_crew(cluster)

        response_serializer = ComplaintSerializer(complaint, context={'request': request})
        detail_serializer = ComplaintDetailSerializer(complaint, context={'request': request})

        return Response({
            "message": "Complaint processed and merged into triage pipeline.",
            "is_new_cluster": is_new,
            "crowd_report_count": cluster.crowd_report_count,
            "computed_priority": cluster.computed_priority,
            "cluster_id": cluster.id,
            "complaint": response_serializer.data,
            "complaint_detail": detail_serializer.data
        }, status=status.HTTP_201_CREATED)



class ComplaintCreateView(ReportIssueView):
    """Backwards-compatible alias for ReportIssueView."""
    pass


class ComplaintListView(generics.ListAPIView):
    """List citizen reports isolated by authenticated user or guest user identifier."""
    serializer_class = ComplaintDetailSerializer
    permission_classes = []

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            if self.request.user.is_staff:
                queryset = Complaint.objects.all().select_related('cluster', 'assigned_crew', 'cluster__assigned_crew')
            else:
                queryset = Complaint.objects.filter(user=self.request.user).select_related('cluster', 'assigned_crew', 'cluster__assigned_crew')
        else:
            uid = self.request.query_params.get('user_identifier')
            if uid and uid != 'all':
                queryset = Complaint.objects.filter(user_identifier=uid).select_related('cluster', 'assigned_crew', 'cluster__assigned_crew')
            else:
                queryset = Complaint.objects.none()

        status_param = self.request.query_params.get('status')
        zone_param = self.request.query_params.get('campus_zone')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if zone_param:
            queryset = queryset.filter(campus_zone=zone_param)

        return queryset


class ComplaintDetailView(generics.RetrieveAPIView):
    """Retrieve full details of an individual complaint report."""
    queryset = Complaint.objects.all().select_related('cluster', 'assigned_crew', 'cluster__assigned_crew')
    serializer_class = ComplaintDetailSerializer
    lookup_field = 'id'


class ComplaintConfirmResolutionView(APIView):
    """
    Step 6: Reporter Confirmation
    Reporter confirms if fix was successful (Closes ticket + increases reputation)
    or rejects (Reopens ticket for crew reinspection).
    """
    def post(self, request, id):
        try:
            complaint = Complaint.objects.get(id=id)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ComplaintConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        is_confirmed = serializer.validated_data['is_confirmed']
        feedback = serializer.validated_data.get('feedback', '')

        complaint.is_confirmed_by_reporter = is_confirmed
        complaint.reporter_feedback = feedback

        if is_confirmed:
            complaint.status = ComplaintStatus.CLOSED
            if complaint.cluster:
                complaint.cluster.status = ComplaintStatus.CLOSED
                complaint.cluster.save()
            adjust_user_trust_score(complaint.user_identifier, is_accurate=True)
            msg = "Resolution confirmed by reporter. Ticket closed."
        else:
            complaint.status = ComplaintStatus.REOPENED
            if complaint.cluster:
                complaint.cluster.status = ComplaintStatus.REOPENED
                complaint.cluster.save()
            msg = "Reporter indicated fix did not hold. Ticket reopened."

        complaint.save()
        return Response({"message": msg, "status": complaint.status})


class ComplaintUpvoteView(APIView):
    """
    Crowd Upvote Action:
    Allows citizens to upvote an existing complaint/cluster, directly boosting
    its crowd_report_count and computed priority in the triage queue.
    """
    permission_classes = []

    def post(self, request, id):
        cluster = None
        complaint = None

        try:
            complaint = Complaint.objects.select_related('cluster').get(id=id)
            cluster = complaint.cluster
        except Complaint.DoesNotExist:
            try:
                cluster = ComplaintCluster.objects.get(id=id)
            except ComplaintCluster.DoesNotExist:
                return Response({"detail": "Incident not found."}, status=status.HTTP_404_NOT_FOUND)

        if cluster:
            cluster.crowd_report_count += 1
            cluster.computed_priority = calculate_crowd_priority(cluster.base_severity, cluster.crowd_report_count)
            cluster.save(update_fields=['crowd_report_count', 'computed_priority', 'updated_at'])
            return Response({
                "message": "Incident upvoted successfully.",
                "id": str(id),
                "crowd_report_count": cluster.crowd_report_count,
                "computed_priority": cluster.computed_priority,
            }, status=status.HTTP_200_OK)

        return Response({
            "message": "Upvoted.",
            "id": str(id),
            "crowd_report_count": 1,
            "computed_priority": 5.0,
        }, status=status.HTTP_200_OK)


class AdminClusterListView(generics.ListAPIView):
    """Admin live feed of complaint clusters ordered by crowd priority."""
    serializer_class = ComplaintClusterSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = ComplaintCluster.objects.all().select_related('assigned_crew').prefetch_related('reports')
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class AdminMapMarkersView(APIView):
    """
    Section 5.4: Live Command Center Map
    Returns open clusters with GPS, urgency color codes, crowd count, and assigned crew.
    """
    def get(self, request):
        clusters = ComplaintCluster.objects.exclude(
            status__in=[ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]
        ).select_related('assigned_crew').prefetch_related('reports')

        data = []
        for c in clusters:
            reports = c.reports.all()
            first_comp = reports[0] if len(reports) > 0 else None
            data.append({
                "id": str(c.id),
                "title": c.title,
                "department": c.department,
                "assigned_department": first_comp.assigned_department if (first_comp and first_comp.assigned_department) else c.department,
                "campus_zone": c.campus_zone,
                "latitude": float(c.latitude),
                "longitude": float(c.longitude),
                "crowd_count": c.crowd_report_count,
                "crowd_report_count": c.crowd_report_count,
                "computed_priority": c.computed_priority,
                "severity_score": first_comp.severity_score if first_comp else c.base_severity,
                "base_severity": c.base_severity,
                "ai_summary": first_comp.ai_summary if (first_comp and first_comp.ai_summary) else (first_comp.citizen_description or first_comp.raw_text if first_comp else c.title),
                "status": c.status,
                "preview_complaint_id": str(first_comp.id) if first_comp else None,
                "assigned_crew_name": c.assigned_crew.name if c.assigned_crew else None,
                "created_at": c.created_at.isoformat()
            })

        return Response(data, status=status.HTTP_200_OK)


class CampusHealthAnalyticsView(APIView):
    """
    Section 5.4: Campus-wide Health View
    Aggregates issue frequency and average severity per building / campus zone.
    """
    def get(self, request):
        stats = Complaint.objects.values('campus_zone', 'department').annotate(
            total_issues=Count('id'),
            avg_severity=Avg('initial_severity')
        ).order_by('-total_issues')

        return Response({"campus_health": list(stats)}, status=status.HTTP_200_OK)


class PriorityOverrideView(APIView):
    """
    Section 5.4: Admin manual override of AI-assigned priority score, status, and crew assignment.
    Fulfills human-in-the-loop requirement.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    @transaction.atomic
    def patch(self, request, cluster_id):
        return self._handle_override(request, cluster_id)

    @transaction.atomic
    def post(self, request, cluster_id):
        return self._handle_override(request, cluster_id)

    def _handle_override(self, request, cluster_id):
        cluster = None
        comp = None
        try:
            cluster = ComplaintCluster.objects.select_related('assigned_crew').get(id=cluster_id)
        except ComplaintCluster.DoesNotExist:
            try:
                comp = Complaint.objects.select_related('cluster', 'assigned_crew').get(id=cluster_id)
                cluster = comp.cluster
            except Complaint.DoesNotExist:
                return Response({"error": "Cluster or Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        # 1. Update Priority
        new_priority = data.get('computed_priority') if 'computed_priority' in data else data.get('priority')
        if new_priority is not None:
            try:
                val = round(float(new_priority), 2)
                if not (1.0 <= val <= 10.0):
                    return Response({"error": "Priority must be between 1.0 and 10.0"}, status=status.HTTP_400_BAD_REQUEST)
                if cluster:
                    cluster.computed_priority = val
                    cluster.base_severity = int(val)
                    cluster.reports.all().update(severity_score=int(val))
                if comp:
                    comp.severity_score = int(val)
                    comp.initial_severity = int(val)
            except (ValueError, TypeError):
                return Response({"error": "Invalid priority value"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Update Status
        new_status = data.get('status')
        if new_status:
            normalized_status = str(new_status).upper()
            if normalized_status in ComplaintStatus.values:
                new_status = normalized_status
            else:
                return Response({
                    "error": f"Invalid status '{new_status}'. Allowed: {list(ComplaintStatus.values)}"
                }, status=status.HTTP_400_BAD_REQUEST)
            if cluster:
                cluster.status = new_status
                cluster.reports.all().update(status=new_status)
            if comp:
                comp.status = new_status

        # 3. Update Assigned Maintenance Crew
        if 'assigned_crew' in data:
            crew_id = data.get('assigned_crew')
            if crew_id in (None, '', 'none', 'null'):
                if cluster and cluster.assigned_crew:
                    old_crew = cluster.assigned_crew
                    old_crew.active_tasks_count = max(0, old_crew.active_tasks_count - 1)
                    old_crew.save()
                    cluster.assigned_crew = None
                    cluster.reports.all().update(assigned_crew=None)
                if comp:
                    comp.assigned_crew = None
            else:
                try:
                    crew = MaintenanceCrew.objects.get(id=crew_id)
                    if cluster:
                        if cluster.assigned_crew != crew:
                            if cluster.assigned_crew:
                                old_crew = cluster.assigned_crew
                                old_crew.active_tasks_count = max(0, old_crew.active_tasks_count - 1)
                                old_crew.save()
                            cluster.assigned_crew = crew
                            crew.active_tasks_count += 1
                            crew.save()
                        cluster.reports.all().update(assigned_crew=crew)
                        if cluster.status in [ComplaintStatus.SUBMITTED, ComplaintStatus.QUEUED]:
                            cluster.status = ComplaintStatus.ASSIGNED
                            cluster.reports.all().update(status=ComplaintStatus.ASSIGNED)
                    if comp:
                        comp.assigned_crew = crew
                except MaintenanceCrew.DoesNotExist:
                    return Response({"error": f"MaintenanceCrew with id '{crew_id}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Update Admin & Committee Oversight Notes
        admin_notes = data.get('admin_notes')
        if admin_notes is not None:
            if cluster:
                cluster.reports.all().update(admin_notes=admin_notes)
            if comp:
                comp.admin_notes = admin_notes

        faculty_supervisor = data.get('faculty_supervisor')
        if faculty_supervisor is not None:
            if cluster:
                cluster.faculty_supervisor = faculty_supervisor
                cluster.reports.all().update(faculty_supervisor=faculty_supervisor)
            if comp:
                comp.faculty_supervisor = faculty_supervisor

        student_lead = data.get('student_lead')
        if student_lead is not None:
            if cluster:
                cluster.student_lead = student_lead
                cluster.reports.all().update(student_lead=student_lead)
            if comp:
                comp.student_lead = student_lead

        committee_notes = data.get('committee_notes')
        if committee_notes is not None:
            if cluster:
                cluster.committee_notes = committee_notes
                cluster.reports.all().update(committee_notes=committee_notes)
            if comp:
                comp.committee_notes = committee_notes

        if cluster:
            cluster.save()
        if comp:
            comp.save()

        active_cluster = cluster or (comp.cluster if comp else None)
        crew_obj = active_cluster.assigned_crew if active_cluster else (comp.assigned_crew if comp else None)
        crew_details = MaintenanceCrewSerializer(crew_obj).data if crew_obj else None

        return Response({
            "message": "Human-in-the-loop override saved successfully.",
            "cluster_id": str(active_cluster.id) if active_cluster else str(comp.id),
            "computed_priority": active_cluster.computed_priority if active_cluster else float(comp.severity_score),
            "status": active_cluster.status if active_cluster else comp.status,
            "assigned_crew": str(crew_obj.id) if crew_obj else None,
            "assigned_crew_details": crew_details,
            "cluster": ComplaintClusterSerializer(active_cluster).data if active_cluster else None
        }, status=status.HTTP_200_OK)


class MaintenanceCrewListCreateView(generics.ListCreateAPIView):
    """Manage repair crews and view live locations/workload."""
    queryset = MaintenanceCrew.objects.all()
    serializer_class = MaintenanceCrewSerializer


class AdminConnectPortalView(APIView):
    """
    Section 5.5: Admin Connect Portal
    Returns designated contact / officer for a specific department or building.
    """
    def get(self, request):
        dept = request.query_params.get('department', 'GENERAL')
        contacts = {
            "PLUMBING": {"officer": "Mr. R. K. Sharma", "designation": "Superintendent of Water Works", "phone": "+91 98765 43210", "email": "plumbing@campus.edu"},
            "ELECTRICAL": {"officer": "Mr. A. Verma", "designation": "Chief Electrical Engineer", "phone": "+91 98765 43211", "email": "electrical@campus.edu"},
            "SANITATION": {"officer": "Mrs. S. Devi", "designation": "Sanitation Officer", "phone": "+91 98765 43212", "email": "sanitation@campus.edu"},
            "CIVIL": {"officer": "Mr. P. Gupta", "designation": "Campus Estate Manager", "phone": "+91 98765 43213", "email": "civil@campus.edu"},
            "SAFETY": {"officer": "Chief Proctor / Security Control", "designation": "Campus Safety Chief", "phone": "+91 98765 43214", "email": "safety@campus.edu"},
            "GENERAL": {"officer": "Central Maintenance Desk", "designation": "Helpdesk Coordinator", "phone": "+91 98765 43200", "email": "admin@campus.edu"},
        }
        return Response(contacts.get(dept.upper(), contacts["GENERAL"]))

class AdminClusterStatusUpdateView(APIView):
    """Admin completes tracking of an issue cluster & sets it to RESOLVED."""
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def patch(self, request, cluster_id):
        # Fallback to complaint ID check if cluster logic is skipped
        cluster = None
        try:
            cluster = ComplaintCluster.objects.get(id=cluster_id)
        except ComplaintCluster.DoesNotExist:
            try:
                comp = Complaint.objects.get(id=cluster_id)
                cluster = comp.cluster
                if not cluster:
                    new_status = request.data.get('status')
                    if new_status != ComplaintStatus.RESOLVED:
                        return Response({"error": "Only RESOLVED is supported."}, status=status.HTTP_400_BAD_REQUEST)
                    if comp.status != ComplaintStatus.RESOLVED:
                        comp.status = ComplaintStatus.RESOLVED
                        comp.save()
                        title = comp.gemini_analysis.get('title', f"Issue #{str(comp.id)[:8]}") if isinstance(comp.gemini_analysis, dict) else f"Issue #{str(comp.id)[:8]}"
                        uid = comp.user.username if comp.user else comp.user_identifier
                        if uid:
                            Notification.objects.create(
                                user_identifier=uid,
                                message=f"Your {title} issue has been completed."
                            )
                    return Response({"message": "Complaint updated successfully", "status": comp.status})
            except Complaint.DoesNotExist:
                return Response({"error": "Cluster or Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status != ComplaintStatus.RESOLVED:
            return Response({"error": "Only RESOLVED status is supported"}, status=status.HTTP_400_BAD_REQUEST)

        if cluster.status != ComplaintStatus.RESOLVED:
            cluster.status = ComplaintStatus.RESOLVED
            cluster.save()

            notified_users = set()
            for comp in cluster.reports.all():
                if comp.status != ComplaintStatus.RESOLVED:
                    comp.status = ComplaintStatus.RESOLVED
                    comp.save()
                    uid = comp.user.username if comp.user else comp.user_identifier
                    if uid and uid not in notified_users:
                        title = comp.gemini_analysis.get('title', f"Issue #{str(comp.id)[:8]}") if isinstance(comp.gemini_analysis, dict) else f"Issue #{str(comp.id)[:8]}"
                        Notification.objects.create(
                            user_identifier=uid,
                            message=f"Your {title} issue has been completed."
                        )
                        notified_users.add(uid)

        return Response({"message": "Cluster status updated successfully", "status": cluster.status})

class NotificationListView(generics.ListAPIView):
    """Retrieve unread citizen issue event logs."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user_identifier=self.request.user.username)

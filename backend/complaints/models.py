import uuid
from django.db import models
from django.conf import settings

class DepartmentType(models.TextChoices):
    PLUMBING = 'PLUMBING', 'Plumbing & Water Supply'
    ELECTRICAL = 'ELECTRICAL', 'Electrical & Lighting'
    SANITATION = 'SANITATION', 'Sanitation & Waste Management'
    CIVIL = 'CIVIL', 'Civil Infrastructure & Roads'
    SAFETY = 'SAFETY', 'Public Safety & Hazards'
    GENERAL = 'GENERAL', 'General Administration'

class ComplaintStatus(models.TextChoices):
    SUBMITTED = 'SUBMITTED', 'Submitted'
    QUEUED = 'QUEUED', 'Queued in Triage'
    ASSIGNED = 'ASSIGNED', 'Assigned to Crew'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    RESOLVED = 'RESOLVED', 'Resolved (Pending Confirmation)'
    CLOSED = 'CLOSED', 'Confirmed & Closed'
    REOPENED = 'REOPENED', 'Reopened by Citizen'
    REJECTED = 'REJECTED', 'Rejected / Spam'

class MaintenanceCrew(models.Model):
    """Crew member / repair team capable of resolving specific infrastructure issues."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    department = models.CharField(max_length=50, choices=DepartmentType.choices, default=DepartmentType.GENERAL)
    phone_number = models.CharField(max_length=20, blank=True, default='')
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    active_tasks_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.department}) - Active Tasks: {self.active_tasks_count}"

class ComplaintCluster(models.Model):
    """
    Crowd-weighted cluster for grouping duplicate reports describing the same underlying issue.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    department = models.CharField(max_length=50, choices=DepartmentType.choices, default=DepartmentType.GENERAL)
    campus_zone = models.CharField(max_length=150, blank=True, default='Main Campus', help_text="e.g. Hostel Block B, Library, Cafeteria")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Crowd Urgency Calculations
    base_severity = models.IntegerField(default=1, help_text="AI evaluated initial severity (1-10)")
    crowd_report_count = models.PositiveIntegerField(default=1, help_text="Number of students/citizens reporting this")
    computed_priority = models.FloatField(default=1.0, help_text="Crowd & recency weighted urgency score")
    
    status = models.CharField(max_length=30, choices=ComplaintStatus.choices, default=ComplaintStatus.SUBMITTED)
    assigned_crew = models.ForeignKey(MaintenanceCrew, null=True, blank=True, on_delete=models.SET_NULL, related_name='clusters')
    
    # Committee Oversight (Faculty, Worker Crew, Student Lead)
    faculty_supervisor = models.CharField(max_length=200, blank=True, default='', help_text="Designated teacher / faculty mentor")
    student_lead = models.CharField(max_length=200, blank=True, default='', help_text="Student observer / council lead")
    committee_notes = models.TextField(blank=True, default='', help_text="Notes and directives from oversight committee")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-computed_priority', '-created_at']

    def __str__(self):
        return f"[{self.campus_zone}] {self.title} (Crowd: {self.crowd_report_count}, Priority: {self.computed_priority:.1f})"

class Complaint(models.Model):
    """Individual civic issue report submitted by a citizen / student."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="complaints",
    )
    user_identifier = models.CharField(max_length=255, blank=True, default='anonymous_user')
    user_trust_score = models.FloatField(default=1.0, help_text="User reputation score (0.0 to 1.0)")
    
    # Writable user inputs
    citizen_description = models.TextField(blank=True, default='', help_text="Plain-text problem description in user's own words")
    raw_text = models.TextField(blank=True, default='', help_text="Plain-text problem description in user's own words")
    image = models.ImageField(upload_to='uploads/%Y/%m/%d/', blank=True, null=True)
    compressed_image = models.ImageField(upload_to='uploads/compressed/%Y/%m/%d/', blank=True, null=True)

    # Location & Campus Zone
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    campus_zone = models.CharField(max_length=150, blank=True, default='Main Campus', help_text="Building or Zone Name")
    address = models.CharField(max_length=500, blank=True, default='')

    # AI Triage & CV Results (flat fields)
    detected_class = models.CharField(max_length=100, blank=True, default='')
    yolo_confidence = models.FloatField(null=True, blank=True, default=0.0)
    severity_score = models.IntegerField(default=5, help_text="AI estimated severity 1-10")
    assigned_department = models.CharField(max_length=50, choices=DepartmentType.choices, default=DepartmentType.GENERAL)
    is_emergency = models.BooleanField(default=False)
    ai_summary = models.TextField(blank=True, default='')

    # AI Triage & CV Results (JSON & metrics)
    department = models.CharField(max_length=50, choices=DepartmentType.choices, default=DepartmentType.GENERAL)
    initial_severity = models.IntegerField(default=5, help_text="AI estimated severity 1-10")
    blur_score = models.FloatField(default=0.0)
    is_valid_image = models.BooleanField(default=True)
    yolo_detections = models.JSONField(default=dict, blank=True)
    gemini_analysis = models.JSONField(default=dict, blank=True)
    
    # Crowd Clustering & Dispatch
    cluster = models.ForeignKey(ComplaintCluster, null=True, blank=True, on_delete=models.SET_NULL, related_name='reports')
    assigned_crew = models.ForeignKey(MaintenanceCrew, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_complaints')
    status = models.CharField(max_length=30, choices=ComplaintStatus.choices, default=ComplaintStatus.SUBMITTED)
    
    # 2-Way Resolution Confirmation
    is_confirmed_by_reporter = models.BooleanField(null=True, blank=True, help_text="True if reporter confirms fix, False if reopened")
    reporter_feedback = models.TextField(blank=True, default='')
    admin_notes = models.TextField(blank=True, default='')

    # Committee Oversight
    faculty_supervisor = models.CharField(max_length=200, blank=True, default='')
    student_lead = models.CharField(max_length=200, blank=True, default='')
    committee_notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['campus_zone', 'status']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f"Report #{str(self.id)[:8]} - {self.department} ({self.status})"

class Notification(models.Model):
    user_identifier = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user_identifier}: {self.message[:20]}"

class UserProfile(models.Model):
    """Institutional verified profile for Student Roll Numbers and Faculty Codes."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(max_length=30, default='student')
    roll_no = models.CharField(max_length=50, blank=True, default='', help_text="Official Student University Roll No")
    employee_id = models.CharField(max_length=50, blank=True, default='', help_text="Official Teacher / Staff ID")
    department = models.CharField(max_length=100, blank=True, default='General')
    designation = models.CharField(max_length=100, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        code = self.roll_no if self.role == 'student' else self.employee_id
        return f"[{self.role.upper()}] {self.user.username} ({code or 'N/A'}) - {self.department}"

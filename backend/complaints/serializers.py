from rest_framework import serializers
from .models import Complaint, ComplaintCluster, MaintenanceCrew, ComplaintStatus, Notification

class MaintenanceCrewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceCrew
        fields = '__all__'

class ComplaintClusterSerializer(serializers.ModelSerializer):
    assigned_crew_details = MaintenanceCrewSerializer(source='assigned_crew', read_only=True)
    report_count = serializers.IntegerField(source='crowd_report_count', read_only=True)
    preview_complaint_id = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintCluster
        fields = [
            'id',
            'title',
            'department',
            'campus_zone',
            'latitude',
            'longitude',
            'base_severity',
            'crowd_report_count',
            'report_count',
            'computed_priority',
            'status',
            'assigned_crew',
            'assigned_crew_details',
            'preview_complaint_id',
            'created_at',
            'updated_at'
        ]

    def get_preview_complaint_id(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'reports' in obj._prefetched_objects_cache:
            reports = obj.reports.all()
            return str(reports[0].id) if len(reports) > 0 else None
        first_comp = obj.reports.first()
        return str(first_comp.id) if first_comp else None


class ComplaintSerializer(serializers.ModelSerializer):
    """
    ModelSerializer for Complaint model.
    Writable user inputs: image, citizen_description, latitude, longitude (and raw_text, campus_zone, address).
    Strictly read-only AI-generated fields: detected_class, yolo_confidence, severity_score, assigned_department, is_emergency, ai_summary.
    """
    user = serializers.ReadOnlyField(source='user.username')
    citizen_description = serializers.CharField(required=False, allow_blank=True)
    raw_text = serializers.CharField(required=False, allow_blank=True)

    detected_class = serializers.CharField(read_only=True)
    yolo_confidence = serializers.FloatField(read_only=True)
    severity_score = serializers.IntegerField(read_only=True)
    assigned_department = serializers.CharField(read_only=True)
    is_emergency = serializers.BooleanField(read_only=True)
    ai_summary = serializers.CharField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'user',
            'user_identifier',
            'citizen_description',
            'raw_text',
            'image',
            'compressed_image',
            'latitude',
            'longitude',
            'campus_zone',
            'address',
            'detected_class',
            'yolo_confidence',
            'severity_score',
            'assigned_department',
            'is_emergency',
            'ai_summary',
            'department',
            'initial_severity',
            'blur_score',
            'is_valid_image',
            'yolo_detections',
            'gemini_analysis',
            'status',
            'cluster',
            'assigned_crew',
            'is_confirmed_by_reporter',
            'reporter_feedback',
            'admin_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'user_identifier',
            'compressed_image',
            'detected_class',
            'yolo_confidence',
            'severity_score',
            'assigned_department',
            'is_emergency',
            'ai_summary',
            'department',
            'initial_severity',
            'blur_score',
            'is_valid_image',
            'yolo_detections',
            'gemini_analysis',
            'status',
            'cluster',
            'assigned_crew',
            'is_confirmed_by_reporter',
            'reporter_feedback',
            'admin_notes',
            'created_at',
            'updated_at',
        ]

    def validate_latitude(self, value):
        if value is not None and not (-90.0 <= float(value) <= 90.0):
            raise serializers.ValidationError("Latitude must be between -90.0 and 90.0")
        return value

    def validate_longitude(self, value):
        if value is not None and not (-180.0 <= float(value) <= 180.0):
            raise serializers.ValidationError("Longitude must be between -180.0 and 180.0")
        return value

    def validate_citizen_description(self, value):
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Description exceeds maximum 5000 characters limit.")
            import html
            return html.escape(value.strip())
        return value

    def validate_raw_text(self, value):
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Text exceeds maximum 5000 characters limit.")
            import html
            return html.escape(value.strip())
        return value

    def validate_campus_zone(self, value):
        if value:
            import html
            return html.escape(value.strip()[:150])
        return value

    def validate_address(self, value):
        if value:
            import html
            return html.escape(value.strip()[:500])
        return value

    def validate(self, attrs):
        # Sync citizen_description and raw_text
        if attrs.get('citizen_description') and not attrs.get('raw_text'):
            attrs['raw_text'] = attrs['citizen_description']
        elif attrs.get('raw_text') and not attrs.get('citizen_description'):
            attrs['citizen_description'] = attrs['raw_text']
        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Fallback for detected_class & confidence if blank in DB column
        if not ret.get('detected_class') and instance.yolo_detections and isinstance(instance.yolo_detections, dict):
            detections = instance.yolo_detections.get('detections', [])
            if detections and isinstance(detections, list) and len(detections) > 0:
                ret['detected_class'] = detections[0].get('label', '')
                if not ret.get('yolo_confidence'):
                    ret['yolo_confidence'] = detections[0].get('confidence', 0.0)

        # Fallback for severity, department, urgency, summary from gemini_analysis
        if instance.gemini_analysis and isinstance(instance.gemini_analysis, dict):
            if ret.get('severity_score') is None or ret.get('severity_score') == 5:
                if 'severity_score' in instance.gemini_analysis:
                    try:
                        ret['severity_score'] = int(instance.gemini_analysis['severity_score'])
                    except (ValueError, TypeError):
                        pass
            if not ret.get('assigned_department') or ret.get('assigned_department') == 'GENERAL':
                if 'department' in instance.gemini_analysis:
                    ret['assigned_department'] = instance.gemini_analysis['department']
            if not ret.get('ai_summary'):
                ret['ai_summary'] = instance.gemini_analysis.get('summary', '')
            if not ret.get('is_emergency'):
                urgency = str(instance.gemini_analysis.get('urgency', '')).upper()
                if urgency in ['HIGH', 'CRITICAL'] or instance.gemini_analysis.get('is_emergency') is True:
                    ret['is_emergency'] = True
        return ret

class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Citizen plain-text report serializer with optional photo & auto GPS."""
    class Meta:
        model = Complaint
        fields = [
            'id',
            'user_identifier',
            'raw_text',
            'image',
            'latitude',
            'longitude',
            'campus_zone',
            'address'
        ]
        read_only_fields = ['id']

class ComplaintDetailSerializer(serializers.ModelSerializer):
    cluster_details = ComplaintClusterSerializer(source='cluster', read_only=True)
    crew_details = MaintenanceCrewSerializer(source='assigned_crew', read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'

class ComplaintConfirmSerializer(serializers.Serializer):
    """Reporter verification serializer for confirming or reopening resolved tickets."""
    is_confirmed = serializers.BooleanField(required=True)
    feedback = serializers.CharField(required=False, allow_blank=True)

class PriorityOverrideSerializer(serializers.Serializer):
    """Admin manual override serializer."""
    priority = serializers.FloatField(min_value=1.0, max_value=10.0, required=True)
    admin_notes = serializers.CharField(required=False, allow_blank=True)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user_identifier', 'message', 'created_at', 'is_read']

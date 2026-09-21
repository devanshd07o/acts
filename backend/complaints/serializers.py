from rest_framework import serializers
from .models import Complaint, ComplaintCluster, MaintenanceCrew, ComplaintStatus

class MaintenanceCrewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceCrew
        fields = '__all__'

class ComplaintClusterSerializer(serializers.ModelSerializer):
    assigned_crew_details = MaintenanceCrewSerializer(source='assigned_crew', read_only=True)
    report_count = serializers.IntegerField(source='crowd_report_count', read_only=True)

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
            'created_at',
            'updated_at'
        ]

class ComplaintSerializer(serializers.ModelSerializer):
    """
    ModelSerializer for Complaint model.
    Writable user inputs: image, latitude, longitude, citizen_description.
    Strictly read-only AI-generated fields: detected_class, yolo_confidence, severity_score, assigned_department, is_emergency, ai_summary.
    """
    citizen_description = serializers.CharField(source='raw_text', required=False, allow_blank=True)
    
    detected_class = serializers.SerializerMethodField(read_only=True)
    yolo_confidence = serializers.SerializerMethodField(read_only=True)
    severity_score = serializers.SerializerMethodField(read_only=True)
    assigned_department = serializers.CharField(source='department', read_only=True)
    is_emergency = serializers.SerializerMethodField(read_only=True)
    ai_summary = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'user_identifier',
            'citizen_description',
            'raw_text',
            'image',
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
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'detected_class',
            'yolo_confidence',
            'severity_score',
            'assigned_department',
            'is_emergency',
            'ai_summary',
            'created_at',
            'updated_at',
        ]

    def get_detected_class(self, obj):
        if obj.yolo_detections and isinstance(obj.yolo_detections, dict):
            detections = obj.yolo_detections.get('detections', [])
            if detections and isinstance(detections, list) and len(detections) > 0:
                return detections[0].get('label', None)
        return None

    def get_yolo_confidence(self, obj):
        if obj.yolo_detections and isinstance(obj.yolo_detections, dict):
            detections = obj.yolo_detections.get('detections', [])
            if detections and isinstance(detections, list) and len(detections) > 0:
                return detections[0].get('confidence', None)
        return None

    def get_severity_score(self, obj):
        if obj.gemini_analysis and isinstance(obj.gemini_analysis, dict):
            score = obj.gemini_analysis.get('severity_score')
            if score is not None:
                return score
        return obj.initial_severity

    def get_is_emergency(self, obj):
        if obj.gemini_analysis and isinstance(obj.gemini_analysis, dict):
            urgency = str(obj.gemini_analysis.get('urgency', '')).upper()
            if urgency in ['HIGH', 'CRITICAL']:
                return True
            if obj.gemini_analysis.get('is_emergency') is True:
                return True
        return obj.initial_severity >= 8

    def get_ai_summary(self, obj):
        if obj.gemini_analysis and isinstance(obj.gemini_analysis, dict):
            return obj.gemini_analysis.get('summary', '')
        return ''

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


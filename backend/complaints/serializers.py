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
        first_comp = obj.reports.first()
        return str(first_comp.id) if first_comp else None

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

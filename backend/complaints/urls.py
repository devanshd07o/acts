from django.urls import path
from .views import (
    HealthCheckView,
    CurrentUserView,
    ComplaintCreateView,
    ComplaintListView,
    ComplaintDetailView,
    ComplaintConfirmResolutionView,
    AdminClusterListView,
    AdminMapMarkersView,
    CampusHealthAnalyticsView,
    PriorityOverrideView,
    MaintenanceCrewListCreateView,
    AdminConnectPortalView,
    AdminClusterStatusUpdateView,
    NotificationListView
)

urlpatterns = [
    # System Health
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('me/', CurrentUserView.as_view(), name='current-user'),

    # Citizen Reporting & Lifecycle
    path('complaints/report/', ComplaintCreateView.as_view(), name='complaint-report'),
    path('complaints/', ComplaintListView.as_view(), name='complaint-list'),
    path('complaints/<uuid:id>/', ComplaintDetailView.as_view(), name='complaint-detail'),
    path('complaints/<uuid:id>/confirm/', ComplaintConfirmResolutionView.as_view(), name='complaint-confirm-resolution'),

    # Admin Live Command Center & Triage
    path('admin/clusters/', AdminClusterListView.as_view(), name='admin-clusters'),
    path('admin/clusters/<uuid:cluster_id>/status/', AdminClusterStatusUpdateView.as_view(), name='admin-cluster-status'),
    path('admin/map-markers/', AdminMapMarkersView.as_view(), name='admin-map-markers'),
    path('admin/campus-health/', CampusHealthAnalyticsView.as_view(), name='admin-campus-health'),
    path('admin/clusters/<uuid:cluster_id>/override-priority/', PriorityOverrideView.as_view(), name='admin-priority-override'),

    # Crew & Direct Connect
    path('admin/crews/', MaintenanceCrewListCreateView.as_view(), name='admin-crews'),
    path('admin/connect/', AdminConnectPortalView.as_view(), name='admin-connect-portal'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
]

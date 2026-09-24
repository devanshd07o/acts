import os
import sys
import django

sys.path.insert(0, r"C:\Users\acer\OneDrive\Desktop\acts\ACTS_project\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "acts_core.settings")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from complaints.models import Complaint, ComplaintCluster, MaintenanceCrew, ComplaintStatus

User = get_user_model()

def run_tests():
    print("=== Testing Priority Override Endpoint ===")

    # 1. Create or get Admin user (is_staff=True)
    admin_user, _ = User.objects.get_or_create(username="test_admin", defaults={"email": "admin@campus.edu", "is_staff": True})
    admin_user.is_staff = True
    admin_user.save()
    admin_token = str(RefreshToken.for_user(admin_user).access_token)

    # 2. Create or get Regular Citizen user (is_staff=False)
    citizen_user, _ = User.objects.get_or_create(username="test_citizen", defaults={"email": "citizen@campus.edu", "is_staff": False})
    citizen_user.is_staff = False
    citizen_user.save()
    citizen_token = str(RefreshToken.for_user(citizen_user).access_token)

    # 3. Create a Maintenance Crew
    crew, _ = MaintenanceCrew.objects.get_or_create(
        name="Rapid Road Repair Unit",
        defaults={"department": "CIVIL", "phone_number": "9999900000", "is_available": True, "active_tasks_count": 0}
    )

    # 4. Create a test cluster
    cluster, _ = ComplaintCluster.objects.get_or_create(
        title="Pothole cluster at Main Gate",
        defaults={
            "department": "CIVIL",
            "campus_zone": "Main Gate",
            "latitude": 12.971600,
            "longitude": 77.594600,
            "base_severity": 4,
            "computed_priority": 4.5,
            "crowd_report_count": 2,
            "status": ComplaintStatus.QUEUED
        }
    )

    # 5. Create a test complaint in this cluster
    complaint, _ = Complaint.objects.get_or_create(
        citizen_description="Large pothole damaging bikes",
        defaults={
            "user": citizen_user,
            "cluster": cluster,
            "severity_score": 4,
            "initial_severity": 4,
            "department": "CIVIL",
            "status": ComplaintStatus.QUEUED,
            "latitude": 12.971600,
            "longitude": 77.594600
        }
    )

    client = APIClient()

    # TEST A: Unauthorized (No token) -> 401
    res_unauth = client.patch(f"/api/admin/clusters/{cluster.id}/override-priority/", {"computed_priority": 8.5}, format="json")
    print(f"Test A (No Auth): Status = {res_unauth.status_code} (Expected 401)")
    assert res_unauth.status_code == 401, f"Expected 401, got {res_unauth.status_code}"

    # TEST B: Forbidden (Citizen token, is_staff=False) -> 403
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {citizen_token}")
    res_forbidden = client.patch(f"/api/admin/clusters/{cluster.id}/override-priority/", {"computed_priority": 8.5}, format="json")
    print(f"Test B (Citizen User): Status = {res_forbidden.status_code} (Expected 403)")
    assert res_forbidden.status_code == 403, f"Expected 403, got {res_forbidden.status_code}"

    # TEST C: Authorized Admin PATCH -> 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    override_payload = {
        "computed_priority": 9.2,
        "status": ComplaintStatus.ASSIGNED,
        "assigned_crew": str(crew.id),
        "admin_notes": "Elevated to urgent priority due to safety risk on bike path."
    }
    res_admin = client.patch(f"/api/admin/clusters/{cluster.id}/override-priority/", override_payload, format="json")
    print(f"Test C (Admin PATCH): Status = {res_admin.status_code} (Expected 200)")
    print(f"Response data: {res_admin.json()}")
    assert res_admin.status_code == 200, f"Expected 200, got {res_admin.status_code}"

    # Verify DB changes
    cluster.refresh_from_db()
    complaint.refresh_from_db()
    crew.refresh_from_db()

    print(f"Cluster Priority: {cluster.computed_priority} (Expected 9.2)")
    print(f"Cluster Status: {cluster.status} (Expected ASSIGNED)")
    print(f"Cluster Crew: {cluster.assigned_crew.name} (Expected Rapid Road Repair Unit)")
    print(f"Crew Active Tasks: {crew.active_tasks_count} (Expected >= 1)")
    print(f"Complaint Priority: {complaint.severity_score} (Expected 9)")
    print(f"Complaint Admin Notes: {complaint.admin_notes}")

    assert cluster.computed_priority == 9.2
    assert cluster.status == ComplaintStatus.ASSIGNED
    assert cluster.assigned_crew == crew
    assert complaint.admin_notes == override_payload["admin_notes"]

    print("\nAll Override Endpoint Tests Passed Successfully!")

if __name__ == "__main__":
    run_tests()

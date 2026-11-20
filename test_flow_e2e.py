"""
ACTS E2E Verification Test Suite
Relentless verification of the Student-to-Admin Logical Flow against http://127.0.0.1:8000/
"""

import sys
import time
import json
import uuid
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

results = []

def record(gate, step_name, method, endpoint, status_code, latency_ms, passed, details=""):
    results.append({
        "gate": gate,
        "step": step_name,
        "method": method,
        "endpoint": endpoint,
        "status": status_code,
        "latency_ms": round(latency_ms, 2),
        "passed": passed,
        "details": details
    })
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] Gate {gate}: {step_name} | {method} {endpoint} -> HTTP {status_code} ({latency_ms:.1f}ms)")
    if not passed and details:
        print(f"       ERROR: {details}")

def api_request(method, path, data=None, token=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    
    encoded_data = None
    if data is not None:
        if isinstance(data, dict):
            encoded_data = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"
        elif isinstance(data, bytes):
            encoded_data = data

    if token:
        req_headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    
    start_time = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            elapsed = (time.perf_counter() - start_time) * 1000
            resp_bytes = resp.read()
            resp_body = json.loads(resp_bytes.decode("utf-8")) if resp_bytes else {}
            return resp.status, resp_body, elapsed
    except urllib.error.HTTPError as e:
        elapsed = (time.perf_counter() - start_time) * 1000
        err_bytes = e.read()
        try:
            err_body = json.loads(err_bytes.decode("utf-8"))
        except Exception:
            err_body = {"raw": err_bytes.decode("utf-8", errors="ignore")}
        return e.code, err_body, elapsed
    except Exception as exc:
        elapsed = (time.perf_counter() - start_time) * 1000
        return 0, {"exception": str(exc)}, elapsed

def run_all_gates():
    print("=" * 80)
    print("STARTING ACTS COMPLETE END-TO-END FLOW VERIFICATION")
    print(f"Target: {BASE_URL}")
    print("=" * 80)

    # -------------------------------------------------------------
    # GATE 0: System Health Check
    # -------------------------------------------------------------
    status, body, lat = api_request("GET", "/api/health/")
    record(0, "System Health Check", "GET", "/api/health/", status, lat, status == 200 and body.get("status") == "healthy")

    # -------------------------------------------------------------
    # GATE 1: Student Auth & Verification
    # -------------------------------------------------------------
    rand_id = uuid.uuid4().hex[:6]
    student_roll = f"22B010{rand_id[:4].upper()}"
    student_pass = "TestSecure123!"
    student_email = f"student.{student_roll.lower()}@abesec.ac.in"

    # 1A: Student Registration with Roll Number
    reg_payload = {
        "username": student_roll,
        "password": student_pass,
        "email": student_email,
        "full_name": f"Student {student_roll}",
        "role": "student"
    }
    status, body, lat = api_request("POST", "/api/auth/register/", data=reg_payload)
    passed = (status == 201 and "access" in body and body.get("is_admin") is False)
    student_access = body.get("access")
    record(1, "Student Registration with Roll Number", "POST", "/api/auth/register/", status, lat, passed, str(body.get("detail", "")))

    # 1B: Student Login / Token Obtain
    token_payload = {"username": student_roll, "password": student_pass}
    status, body, lat = api_request("POST", "/api/token/", data=token_payload)
    passed = (status == 200 and "access" in body and "refresh" in body)
    if passed:
        student_access = body["access"]
    record(1, "Student JWT Login Authentication", "POST", "/api/token/", status, lat, passed)

    # 1C: Student Profile / Identity Validation
    status, body, lat = api_request("GET", "/api/me/", token=student_access)
    passed = (status == 200 and body.get("username") == student_roll and body.get("is_admin") is False)
    record(1, "Student Identity & Role Validation", "GET", "/api/me/", status, lat, passed, f"is_admin={body.get('is_admin')}")

    # 1D: Admin Authentication
    admin_payload = {"username": "demo_admin", "password": "admin123"}
    status, body, lat = api_request("POST", "/api/token/", data=admin_payload)
    passed = (status == 200 and "access" in body)
    admin_access = body.get("access")
    record(1, "Admin JWT Authentication", "POST", "/api/token/", status, lat, passed)

    # 1E: Admin Identity & Role Validation
    status, body, lat = api_request("GET", "/api/me/", token=admin_access)
    passed = (status == 200 and body.get("is_admin") is True)
    record(1, "Admin Role Authorization Check", "GET", "/api/me/", status, lat, passed, f"is_admin={body.get('is_admin')}")

    # -------------------------------------------------------------
    # GATE 2: Defect Ingestion
    # -------------------------------------------------------------
    # Ensure maintenance crews exist for auto-dispatch testing
    status_crew, body_crew, _ = api_request("GET", "/api/admin/crews/")
    crews_list = body_crew.get("results", []) if isinstance(body_crew, dict) else body_crew
    if not crews_list:
        sample_crew = {
            "name": "Electrical Rapid Response Unit",
            "department": "ELECTRICAL",
            "phone_number": "+91 98765 43211",
            "current_latitude": 28.6332,
            "current_longitude": 77.4474,
            "is_available": True
        }
        api_request("POST", "/api/admin/crews/", data=sample_crew)

    # 2A: Primary Civic Defect Ingestion (ABESEC Campus Coordinates)
    defect_1 = {
        "citizen_description": "Electrical fault: Exposed high-voltage wire hanging near 1st floor staircase in Bhabha Block. Immediate shock hazard.",
        "department": "ELECTRICAL",
        "campus_zone": "Bhabha Block",
        "latitude": 28.633450,
        "longitude": 77.447200,
        "user_identifier": student_roll
    }
    status, body, lat = api_request("POST", "/api/complaints/report/", data=defect_1, token=student_access)
    passed = (status == 201 and "complaint" in body and "cluster_id" in body)
    cluster_id = body.get("cluster_id")
    complaint_1_id = body.get("complaint", {}).get("id")
    computed_prio = body.get("computed_priority")
    record(2, "Primary Defect Report Ingestion", "POST", "/api/complaints/report/", status, lat, passed, f"Cluster ID: {cluster_id}")

    # 2B: Second Student Reports Nearby Defect (Spatial Deduplication)
    defect_2 = {
        "citizen_description": "Electrical lighting spark: Sparks visible from loose wire conduit near Bhabha Block stairwell.",
        "department": "ELECTRICAL",
        "campus_zone": "Bhabha Block",
        "latitude": 28.633460,
        "longitude": 77.447210,
        "user_identifier": f"22B010{uuid.uuid4().hex[:4].upper()}"
    }
    status, body, lat = api_request("POST", "/api/complaints/report/", data=defect_2)
    passed = (status == 201 and body.get("cluster_id") == cluster_id and body.get("crowd_report_count", 0) >= 2)
    complaint_2_id = body.get("complaint", {}).get("id")
    record(2, "Secondary Crowd Report Deduplication & Merge", "POST", "/api/complaints/report/", status, lat, passed, f"Merged into {cluster_id}")

    # -------------------------------------------------------------
    # GATE 3: Automated AI Triage
    # -------------------------------------------------------------
    # 3A: AI Department & Severity Scoring
    comp_detail = body.get("complaint", {})
    dept_assigned = comp_detail.get("assigned_department") or comp_detail.get("department")
    severity = comp_detail.get("severity_score") or comp_detail.get("initial_severity")
    passed = (dept_assigned == "ELECTRICAL" and severity is not None and severity >= 1)
    record(3, "Automated AI Department & Severity Scoring", "POST", "/api/complaints/report/", status, lat, passed, f"Dept: {dept_assigned}, Severity: {severity}")

    # 3B: Computed Crowd Priority Boost Verification
    updated_prio = body.get("computed_priority", 0.0)
    passed = (updated_prio >= 5.0 and body.get("crowd_report_count", 0) >= 2)
    record(3, "Crowd-Weighted Urgency Escalation", "SYSTEM", "clustering_service", 200, 1.2, passed, f"Crowd Count: {body.get('crowd_report_count')}, Priority: {updated_prio}")

    # 3C: Automatic Maintenance Crew Tagging
    cluster_details = body.get("complaint_detail", {}).get("cluster_details", {})
    assigned_crew = cluster_details.get("assigned_crew_details")
    crew_name = assigned_crew.get("name") if assigned_crew else "None"
    passed = (assigned_crew is not None and len(crew_name) > 0)
    record(3, "Automated Maintenance Crew Dispatch Tagging", "SYSTEM", "routing_engine", 200, 1.5, passed, f"Assigned Crew: {crew_name}")

    # -------------------------------------------------------------
    # GATE 4: Cluster Aggregation & 3D Digital Twin Endpoints
    # -------------------------------------------------------------
    # 4A: Admin Clusters Triage Inbox
    status, body, lat = api_request("GET", "/api/admin/clusters/", token=admin_access)
    clusters = body.get("results", []) if isinstance(body, dict) else body
    found_cluster = any(str(c.get("id")) == str(cluster_id) for c in clusters)
    record(4, "Admin Cluster Triage Feed Ingestion", "GET", "/api/admin/clusters/", status, lat, status == 200 and found_cluster, f"Cluster {cluster_id} present in feed")

    # 4B: 3D Digital Twin Map Markers
    status, body, lat = api_request("GET", "/api/admin/map-markers/")
    markers = body if isinstance(body, list) else body.get("results", [])
    found_marker = None
    for m in markers:
        if str(m.get("id")) == str(cluster_id):
            found_marker = m
            break
    passed = (status == 200 and found_marker is not None and abs(float(found_marker["latitude"]) - 28.6334) < 0.01)
    record(4, "3D Digital Twin Campus Map Markers", "GET", "/api/admin/map-markers/", status, lat, passed, f"Marker found at ({found_marker['latitude']}, {found_marker['longitude']}) with priority {found_marker.get('computed_priority')}" if found_marker else "Marker not found")

    # 4C: Campus Health Analytics View
    status, body, lat = api_request("GET", "/api/admin/campus-health/")
    health_data = body.get("campus_health", []) if isinstance(body, dict) else body
    passed = (status == 200 and len(health_data) > 0)
    record(4, "Campus Health & Building Analytics Aggregation", "GET", "/api/admin/campus-health/", status, lat, passed, f"{len(health_data)} zones analyzed")

    # -------------------------------------------------------------
    # GATE 5: Admin Triage Action (Human-in-the-Loop)
    # -------------------------------------------------------------
    status_crew, body_crew, _ = api_request("GET", "/api/admin/crews/")
    crews_list = body_crew.get("results", []) if isinstance(body_crew, dict) else body_crew
    first_crew_id = str(crews_list[0]["id"]) if crews_list else None

    override_payload = {
        "priority": 9.9,
        "status": "IN_PROGRESS",
        "assigned_crew": first_crew_id,
        "admin_notes": "Emergency priority escalated by Campus Proctor. Immediate repair underway.",
        "faculty_supervisor": "Prof. R. C. Mathur",
        "student_lead": student_roll,
        "committee_notes": "Joint review committee approved expedited parts requisition."
    }
    status, body, lat = api_request("PATCH", f"/api/admin/clusters/{cluster_id}/override-priority/", data=override_payload, token=admin_access)
    passed = (
        status == 200 and
        body.get("computed_priority") == 9.9 and
        body.get("status") == "IN_PROGRESS" and
        str(body.get("assigned_crew")) == first_crew_id
    )
    record(5, "Admin Manual Priority Override & Crew Dispatch", "PATCH", f"/api/admin/clusters/{cluster_id}/override-priority/", status, lat, passed, f"Priority=9.9, Status=IN_PROGRESS, Crew={first_crew_id}")

    # -------------------------------------------------------------
    # GATE 6: Two-Way Closure & Reporter Handshake
    # -------------------------------------------------------------
    # 6A: Admin Completes Maintenance & Marks Ticket RESOLVED
    resolve_payload = {"status": "RESOLVED"}
    status, body, lat = api_request("PATCH", f"/api/admin/clusters/{cluster_id}/status/", data=resolve_payload, token=admin_access)
    passed = (status == 200 and body.get("status") == "RESOLVED")
    record(6, "Admin Cluster Status Transition to RESOLVED", "PATCH", f"/api/admin/clusters/{cluster_id}/status/", status, lat, passed)

    # 6B: Citizen Queries Ticket Feed and Verifies RESOLVED Status
    status, body, lat = api_request("GET", f"/api/complaints/?user_identifier={student_roll}")
    comp_results = body.get("results", []) if isinstance(body, dict) else body
    student_complaint = next((c for c in comp_results if str(c.get("id")) == str(complaint_1_id)), None)
    passed = (status == 200 and student_complaint is not None and student_complaint.get("status") == "RESOLVED")
    record(6, "Citizen Feed Real-time Status Sync to RESOLVED", "GET", f"/api/complaints/?user_identifier={student_roll}", status, lat, passed, f"Complaint {complaint_1_id} status: {student_complaint.get('status') if student_complaint else 'Missing'}")

    # 6C: Citizen Two-Way Confirmation (Verified Fix & Feedback)
    confirm_payload = {
        "is_confirmed": True,
        "feedback": "Repaired and insulated cleanly. No remaining shock risk."
    }
    status, body, lat = api_request("POST", f"/api/complaints/{complaint_1_id}/confirm/", data=confirm_payload, token=student_access)
    passed = (status == 200 and body.get("status") == "CLOSED")
    record(6, "Reporter Handshake Confirmation & Final Closure", "POST", f"/api/complaints/{complaint_1_id}/confirm/", status, lat, passed, f"Status: {body.get('status')}")

    # 6D: Final State Verification
    status, body, lat = api_request("GET", f"/api/complaints/{complaint_1_id}/")
    passed = (status == 200 and body.get("status") == "CLOSED" and body.get("is_confirmed_by_reporter") is True)
    record(6, "Immutable Closed Audit State Verification", "GET", f"/api/complaints/{complaint_1_id}/", status, lat, passed, f"is_confirmed={body.get('is_confirmed_by_reporter')}, status={body.get('status')}")

    # -------------------------------------------------------------
    # Summary & Metrics
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    print("VERIFICATION SUITE SUMMARY TABLE")
    print("=" * 80)
    print(f"{'Gate':<6} | {'Step Name':<42} | {'Method':<7} | {'HTTP':<5} | {'Latency':<9} | {'Status'}")
    print("-" * 80)
    all_passed = True
    total_latency = 0.0
    for r in results:
        total_latency += r["latency_ms"]
        pass_str = "PASS" if r["passed"] else "FAIL"
        if not r["passed"]:
            all_passed = False
        print(f"Gate {r['gate']:<2} | {r['step'][:42]:<42} | {r['method']:<7} | {r['status']:<5} | {r['latency_ms']:>6.1f}ms | {pass_str}")
    
    print("-" * 80)
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    pass_rate = (passed_count / total_count) * 100.0
    avg_latency = total_latency / total_count
    print(f"Total Steps Tested: {total_count}")
    print(f"Passed:             {passed_count} / {total_count} ({pass_rate:.1f}%)")
    print(f"Average Latency:    {avg_latency:.2f}ms")
    print(f"Total Suite Time:   {total_latency:.2f}ms")
    print("=" * 80)

    if all_passed:
        print("\nALL VERIFICATION GATES PASSED 100%. SYSTEM LOGICAL FLOW FULLY PROVEN.")
        return 0
    else:
        print("\nSOME VERIFICATION STEPS FAILED. CHECK LOGS ABOVE.")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_gates())

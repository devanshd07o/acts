# 🚀 ACTS Backend — Friend's Antigravity Kickoff & Execution Guide

> **Project**: ACTS (Autonomous Civic Triage System) — ABESEC Ghaziabad  
> **Role**: Dedicated Backend Developer (Fresh Git Repository)  
> **Target**: 100% Working, Testable Django REST API with Realistic Campus Seed Data  

---

## 📌 PART 1: Friend ke liye 3 Simple Steps (Read this first)

1. Apne laptop me ek new folder banao (e.g. `acts_backend_clean`).
2. Antigravity IDE ya CLI me wo folder open karo.
3. **Neeche diya gaya "KICKOFF PROMPT FOR ANTIGRAVITY" pura copy karo aur apne Antigravity me paste karke Enter daba do.**
4. Jab Antigravity complete kar le, tab `python seed_acts_data.py` run karo aur `git push` karke hume repo ka link de do.

---

## 🤖 PART 2: KICKOFF PROMPT FOR ANTIGRAVITY (Copy-Paste this into Friend's Antigravity)

```text
You are an expert Backend Engineer building the complete Django REST API for "ACTS — Autonomous Civic Triage System" (an AI-powered civic complaint reporting and triage platform for ABESEC Ghaziabad campus).

Target: Build a standalone, rock-solid, production-grade Django backend in this current directory with SQLite, Django REST Framework, and full CORS support for Flutter/Web clients.

### Strict Technical Requirements:
1. Environment & Setup:
   - Create and activate virtual environment or use existing Python 3.11+.
   - Install: `django djangorestframework django-cors-headers pillow requests python-dotenv`.
   - Project name: `acts_core`. App name: `triage_engine`.
   - In `settings.py`:
     - Allow all hosts: `ALLOWED_HOSTS = ['*']`
     - Enable CORS: Add `corsheaders` to INSTALLED_APPS and `corsheaders.middleware.CorsMiddleware` at top of MIDDLEWARE.
     - `CORS_ALLOW_ALL_ORIGINS = True`
     - Media files setup: `MEDIA_URL = '/media/'`, `MEDIA_ROOT = BASE_DIR / 'media'`.

2. Data Models (in `triage_engine/models.py`):
   - `UserProfile`: OneToOne with User, roles: `CITIZEN`, `DISPATCHER`, `CREW`.
   - `MaintenanceCrew`:
     - `name` (CharField)
     - `department` (CharField: 'PLUMBING', 'ELECTRICAL', 'CIVIL', 'SANITATION', 'SECURITY')
     - `phone` (CharField)
     - `is_available` (BooleanField, default True)
     - `current_latitude` (FloatField, default 28.6340)
     - `current_longitude` (FloatField, default 77.4470)
   - `Complaint`:
     - `ticket_id` (CharField, unique, e.g. "ACTS-2026-001")
     - `user_identifier` (CharField, e.g. username or device ID)
     - `title` (CharField, max 200)
     - `description` (TextField)
     - `category` (CharField: 'PLUMBING', 'ELECTRICAL', 'CIVIL', 'SANITATION', 'SECURITY', 'OTHER')
     - `image` (ImageField, upload_to='complaints/', null=True, blank=True)
     - `latitude` (FloatField)
     - `longitude` (FloatField)
     - `location_name` (CharField, max 200, e.g. "Bhabha Hostel Block C, 2nd Floor")
     - `base_severity` (IntegerField, default 2, range 1-5)
     - `calculated_priority` (FloatField, default 2.0)
     - `status` (CharField: 'SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'REOPENED')
     - `parent_cluster` (ForeignKey to self, null=True, blank=True, related_name='sub_reports')
     - `crowd_report_count` (IntegerField, default 1)
     - `assigned_crew` (ForeignKey to MaintenanceCrew, null=True, blank=True)
     - `ai_summary` (TextField, blank=True)
     - `created_at` (DateTimeField, auto_now_add=True)
     - `updated_at` (DateTimeField, auto_now=True)
   - `ComplaintTimeline`:
     - `complaint` (ForeignKey to Complaint)
     - `status` (CharField)
     - `message` (TextField)
     - `timestamp` (DateTimeField, auto_now_add=True)

3. Core Logic & Algorithms:
   a) **Geospatial Deduplication & Crowd Weighting**:
      - Calculate Haversine distance in meters between new report and existing open reports (`status != 'RESOLVED'` and `status != 'VERIFIED'`).
      - If distance <= 60 meters AND category matches:
        - Attach new report to the existing parent report (`parent_cluster = parent`).
        - Increment `parent.crowd_report_count += 1`.
        - Recalculate priority: `priority = base_severity * (1 + 0.35 * log2(crowd_report_count))`.
        - Update parent's calculated_priority.
      - Else: New standalone cluster master ticket.
   b) **Rule-based + AI Triage Fallback**:
      - If Google Gemini API key is in env (`GEMINI_API_KEY`), call Gemini to summarize and score severity.
      - Otherwise, use smart regex/keyword triage:
        - "spark", "wire", "shock", "fire", "smoke" -> ELECTRICAL, Severity 5
        - "burst", "leak", "flood", "drain" -> PLUMBING, Severity 4
        - "crack", "wall", "plaster", "road", "pothole" -> CIVIL, Severity 3
        - "garbage", "trash", "smell" -> SANITATION, Severity 2
   c) **Crew Dispatch Recommendation**:
      - Find nearest available crew with matching department using distance formula.

4. REST Endpoints (Django REST Framework):
   - `POST /api/complaints/report/`: Accepts multipart form (description, photo, latitude, longitude, location_name, user_identifier). Runs triage, cluster check, returns JSON.
   - `GET /api/complaints/`: Lists all tickets. Supports query params: `?status=`, `?user_identifier=`, `?category=`.
   - `GET /api/complaints/<id>/`: Details with timeline history.
   - `POST /api/complaints/<id>/assign_crew/`: `{ "crew_id": 1 }` -> marks ticket ASSIGNED, crew unavailable.
   - `POST /api/complaints/<id>/resolve/`: `{ "crew_notes": "Replaced fuse" }` -> marks RESOLVED.
   - `POST /api/complaints/<id>/verify/`: `{ "action": "CONFIRM" }` -> VERIFIED, or `{ "action": "REJECT", "reason": "Still leaking" }` -> REOPENED.
   - `GET /api/admin/campus-health/`: Returns JSON stats (total open, critical count, resolved today, category breakdown, campus health index 0-100%).
   - `GET /api/admin/crews/`: Returns list of crews with status and live coordinates.

5. Seed Data Script (`seed_acts_data.py`):
   - Create a standalone python script that seeds 6 realistic ABESEC campus complaints (Hostel 1, Aryabhatta Block, Central Mess, Ramanujan Lab) and 4 maintenance crews.

Please implement all files, apply migrations (`python manage.py makemigrations` and `python manage.py migrate`), create `seed_acts_data.py`, run the seed script, and output verification cURL commands.
```

---

## 📋 PART 3: Exact Specifications & Verification

### 1. Folder Structure Expected in Friend's Repo:
```
acts_backend_clean/
├── manage.py
├── seed_acts_data.py
├── acts_core/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── triage_engine/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── triage_service.py   <-- Clustering & Haversine formula
    ├── views.py
    └── urls.py
```

### 2. ABESEC Campus Coordinates Reference:
- **Campus Center**: `28.6341, 77.4474`
- **Hostel Blocks**: `28.6350, 77.4480`
- **Academic Block (Aryabhatta)**: `28.6335, 77.4465`
- **Central Library / Auditorium**: `28.6330, 77.4485`

### 3. Verification Commands for Friend:
```bash
# 1. Run migrations and seed
python manage.py makemigrations
python manage.py migrate
python seed_acts_data.py

# 2. Start server
python manage.py runserver 0.0.0.0:8000

# 3. Test in another terminal:
curl http://127.0.0.1:8000/api/admin/campus-health/
curl http://127.0.0.1:8000/api/complaints/
```

---

## 🤝 PART 4: Integration with Our Flutter Frontend

Once your friend pushes his repo:
1. We pull or clone his repo.
2. In our Flutter app `lib/config/api_constants.dart`, his server URL will plug-and-play.
3. Every endpoint name, payload structure, and field name matches exactly what Flutter already expects.

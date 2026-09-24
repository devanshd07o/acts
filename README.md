# ACTS (Automated Civic Triage System)

ACTS is an AI and Computer Vision powered civic complaint reporting and triage platform. It combines mobile image capture, GPS validation, YOLO defect detection, and Gemini Multimodal AI to verify, score severity, and prioritize civic issues for municipality authorities.

---

## 🧠 Core AI Workflow

ACTS eliminates manual sorting of civic complaints by utilizing an agentic pipeline:
1. **Report Generation:** Citizens capture geo-tagged images of civic issues (potholes, broken streetlights, illegal dumping) via the cross-platform Flutter app.
2. **Defect Detection (CV):** OpenCV and YOLO validate the image quality and detect primary objects/defects in the frame.
3. **Multimodal Triage (Gemini AI):** The Gemini API analyzes the image and text context to:
   * Verify the authenticity of the civic issue.
   * Assign a **Severity Score (1-10)** based on public safety risk and infrastructure damage.
   * Cluster duplicate reports from the same geographic zone.
4. **Command Center:** The admin dashboard visualizes live, crowd-weighted clusters on an interactive map, allowing authorities to dispatch maintenance crews efficiently.

---

## 📁 Repository Structure

```text
acts-project/
├── .gitignore
├── README.md
├── docker-compose.yml
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   │
│   ├── acts_core/                  # Core Django project configuration
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── complaints/                 # Primary application logic
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py               # Complaint, Location, Status models
│   │   ├── serializers.py          # DRF serializers for multipart data & API responses
│   │   ├── urls.py                 # API routing (/api/complaints/, /api/admin/)
│   │   ├── views.py                # Request handling & pipeline orchestration
│   │   │
│   │   ├── services/               # AI & CV pipeline services
│   │   │   ├── __init__.py
│   │   │   ├── cv_validator.py     # OpenCV blur detection & preprocessing
│   │   │   ├── yolo_detector.py    # YOLO inference (bounding box & defect detection)
│   │   │   ├── gemini_service.py   # Gemini API prompt, multimodal synthesis & JSON parsing
│   │   │   └── image_compressor.py # Pillow compression utility
│   │   │
│   │   └── weights/                # Pre-trained CV model files (e.g. yolo_civic_defect.pt)
│   │
│   └── media/                      # Local storage for compressed uploads (ignored by git)
│       └── uploads/
│
└── mobile/                         # Flutter cross-platform app
    ├── pubspec.yaml
    ├── assets/
    │   ├── icons/
    │   └── images/
    │
    └── lib/
        ├── main.dart               # App entry point & initialization
        │
        ├── config/
        │   ├── api_constants.dart  # Base URLs (Dynamic routing for web/emulator/iOS)
        │   ├── app_routes.dart     # Navigation routing
        │   └── theme.dart          # App colors and styling
        │
        ├── models/
        │   ├── complaint_model.dart
        │   └── map_marker_model.dart
        │
        ├── services/
        │   ├── api_client.dart     # Dio multipart upload, error handling & dynamic IPs
        │   ├── location_service.dart # Geolocator hardware GPS extraction
        │   └── camera_service.dart # Image picker & gallery access
        │
        ├── screens/
        │   ├── citizen/
        │   │   ├── report_issue_screen.dart  # Photo capture, text prompt, submit button
        │   │   └── my_reports_screen.dart    # User's personal submission history
        │   │
        │   └── admin/
        │       ├── admin_map_screen.dart     # flutter_map OpenStreetMap view
        │       └── issue_detail_screen.dart  # Bounding boxes, severity score & status toggle
        │
        └── widgets/
            ├── custom_map_pin.dart # Color-coded pulsing map markers
            ├── severity_badge.dart # 1-10 severity UI indicator
            └── image_preview_card.dart
```

---

## 🚀 Quickstart Guide

### Backend Setup (Dockerized)

The Django API, AI services, and PostgreSQL database are fully containerized. You do not need Python or PostgreSQL installed locally.

1. In the root directory, create a `.env` file and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here


2. Navigate to backend directory:
   ```bash
   cd backend
   ```
3. Create & activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
6. Apply migrations and start the development server:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000
   ```

### Mobile Setup (Flutter)

1. Navigate to mobile directory:
   ```bash
   cd mobile
   ```
2. Fetch dependencies:
   ```bash
   flutter pub get
   ```
3. Run on connected device / emulator:
   ```bash
   flutter run
   ```

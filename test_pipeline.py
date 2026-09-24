import os
import sys
import json
from io import BytesIO
from pathlib import Path

# Set up paths so backend is reachable
PROJECT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_DIR / 'backend'
sys.path.insert(0, str(BACKEND_DIR))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acts_core.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from PIL import Image

User = get_user_model()

def run_test():
    print("=" * 65)
    print("ACTS: Testing ReportIssueView Endpoint Pipeline")
    print("=" * 65)

    # 1. Apply database migrations
    print("[1/5] Checking and applying database migrations...")
    call_command('migrate', verbosity=0)
    print("  -> Database tables up-to-date.")

    # 2. Create test user and generate JWT token
    print("[2/5] Setting up test user and generating JWT token...")
    test_username = 'citizen_tester'
    test_user, _ = User.objects.get_or_create(username=test_username, defaults={'email': 'test@campus.edu'})
    test_user.set_password('SecretP@ss123')
    test_user.save()

    refresh = RefreshToken.for_user(test_user)
    access_token = str(refresh.access_token)
    print(f"  -> User: {test_username}")
    print(f"  -> JWT Access Token: {access_token[:25]}... (truncated)")

    # 3. Create simulated camera image with Pillow
    print("[3/5] Generating temporary test image using Pillow...")
    img = Image.new('RGB', (400, 300), color=(52, 152, 219))
    img_io = BytesIO()
    img.save(img_io, format='JPEG')
    img_io.seek(0)

    test_image = SimpleUploadedFile(
        name='simulated_pothole_camera_capture.jpg',
        content=img_io.read(),
        content_type='image/jpeg'
    )
    print("  -> Simulated image generated (400x300 JPEG).")

    # 4. Issue multipart/form-data request to endpoint
    print("[4/5] Sending authenticated multipart POST request to /api/complaints/report/...")
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    payload = {
        'image': test_image,
        'citizen_description': 'Test pothole on main road near library',
        'raw_text': 'Test pothole on main road near library',
        'latitude': 28.535516,
        'longitude': 77.391026,
        'campus_zone': 'Main Campus',
        'address': 'Campus Ring Road Gate 2'
    }

    response = client.post('/api/complaints/report/', payload, format='multipart')

    # 5. Output results
    print("=" * 65)
    print(f"Response HTTP Status Code: {response.status_code}")
    print("=" * 65)
    try:
        response_data = response.json()
        print(json.dumps(response_data, indent=2))
    except Exception:
        print(response.content.decode('utf-8'))
    print("=" * 65)

    if response.status_code == 201:
        print("[SUCCESS] ReportIssueView successfully created the complaint with AI results!")
        return True
    else:
        print(f"[FAIL] Unexpected status code: {response.status_code}")
        return False

if __name__ == '__main__':
    success = run_test()
    sys.exit(0 if success else 1)

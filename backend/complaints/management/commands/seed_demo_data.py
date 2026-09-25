"""
Management command: seed_demo_data
Creates 3 demo student users + 1 demo admin, each with realistic seeded complaints
that appear as clusters in the admin triage queue and on the campus map.

Usage:
    python manage.py seed_demo_data
    python manage.py seed_demo_data --force   # wipes and re-seeds

Demo accounts:
    Student 1 : demo_student1 / roll=2100320100045
    Student 2 : demo_student2 / roll=2100320100046
    Student 3 : demo_student3 / roll=2100320100047
    Admin     : demo_admin    / employee_id=EMP-2026-1049  (is_staff=True)
"""

import os
import shutil
import requests
import urllib.request
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.core.files import File
from django.conf import settings

# Lazy import inside handle() to avoid AppRegistryNotReady
# All model imports happen after Django is set up

SEED_TAG = "DEMO_SEED_v1"  # unique marker in user_identifier so we can clean selectively

# ---------------------------------------------------------------------------
# ABESEC campus GPS coordinates (Ghaziabad, UP)
# ---------------------------------------------------------------------------
CAMPUS_LAT = 28.6335
CAMPUS_LON = 77.4465

# Realistic complaint scenarios — each student gets 2 complaints
COMPLAINTS_DATA = [
    # Student 1 complaints
    {
        "student_key": "demo_student1",
        "citizen_description": "Bada wala pothole near main gate — bikes aur cars dono ke liye khatarnak hai. Kal ek student gir gaya tha. Urgent repair chahiye.",
        "raw_text": "Large pothole near main gate dangerous for vehicles and pedestrians. Student fell yesterday. Urgent repair needed.",
        "latitude": Decimal("28.6341"),
        "longitude": Decimal("77.4459"),
        "campus_zone": "Main Gate Approach Road",
        "address": "ABESEC Main Gate, NH-24 Bypass, Ghaziabad",
        "department": "CIVIL",
        "severity_score": 8,
        "is_emergency": True,
        "ai_summary": "Large pothole (~40cm diameter, 10cm deep) at main gate ingress. High vehicle traffic + pedestrian crossing risk. Immediate patching required.",
        "detected_class": "pothole",
        "yolo_confidence": 0.87,
        "image_key": "pothole_maingate",
    },
    {
        "student_key": "demo_student1",
        "citizen_description": "Library ke bahar street light kharab hai — raat ko bilkul andhera. Students unsafe feel karte hain.",
        "raw_text": "Street light outside library is broken. Complete darkness at night. Students feel unsafe walking back to hostel.",
        "latitude": Decimal("28.6337"),
        "longitude": Decimal("77.4472"),
        "campus_zone": "Library Block",
        "address": "Central Library, ABESEC Campus, Ghaziabad",
        "department": "ELECTRICAL",
        "severity_score": 6,
        "is_emergency": False,
        "ai_summary": "Non-functional street lamp at library exit. Campus safety hazard after 7 PM. Replacement or rewiring required.",
        "detected_class": "broken_light",
        "yolo_confidence": 0.74,
        "image_key": "streetlight_library",
    },
    # Student 2 complaints
    {
        "student_key": "demo_student2",
        "citizen_description": "Block-C ke washroom mein paani ka pipe toot gaya hai — floor pe paani bharr raha hai aur bahut badbu aa rahi hai.",
        "raw_text": "Water pipe burst in Block-C washroom. Floor completely flooded. Strong sewage odour. Classes disrupted.",
        "latitude": Decimal("28.6330"),
        "longitude": Decimal("77.4468"),
        "campus_zone": "Block C - Academic Wing",
        "address": "Block C, Ground Floor, ABESEC, Ghaziabad",
        "department": "PLUMBING",
        "severity_score": 7,
        "is_emergency": True,
        "ai_summary": "Burst plumbing pipe in Block-C washroom. Active water flooding. Sewage contamination risk. Immediate shutoff valve intervention needed.",
        "detected_class": "water_leak",
        "yolo_confidence": 0.81,
        "image_key": "pipe_burst_blockc",
    },
    {
        "student_key": "demo_student2",
        "citizen_description": "Cafeteria ke bahar zyada kachra pada hai — dustbin full ho gayi hai koi uthane nahi aaya 3 din se.",
        "raw_text": "Garbage overflow outside cafeteria. Dustbin full for 3 days. Flies and smell spreading to nearby classrooms.",
        "latitude": Decimal("28.6333"),
        "longitude": Decimal("77.4461"),
        "campus_zone": "Cafeteria Block",
        "address": "Student Cafeteria, ABESEC Campus, Ghaziabad",
        "department": "SANITATION",
        "severity_score": 5,
        "is_emergency": False,
        "ai_summary": "Overflowing waste bins at cafeteria entrance. 3-day accumulation. Health hazard and pest attraction risk. Daily collection schedule lapsed.",
        "detected_class": "garbage_overflow",
        "yolo_confidence": 0.69,
        "image_key": "garbage_cafeteria",
    },
    # Student 3 complaints
    {
        "student_key": "demo_student3",
        "citizen_description": "Admin block ke peeche wali road par ek khuli manhole hai — raat ko seedha girne ka darr hai. Koi cover nahi hai.",
        "raw_text": "Open uncovered manhole behind admin block. No barricade or warning signs. Night-time fall hazard. Several near-misses reported.",
        "latitude": Decimal("28.6328"),
        "longitude": Decimal("77.4475"),
        "campus_zone": "Admin Block - Rear Road",
        "address": "Rear Road, Admin Block, ABESEC, Ghaziabad",
        "department": "SAFETY",
        "severity_score": 9,
        "is_emergency": True,
        "ai_summary": "Open manhole (cover missing) on rear service road. No signage or barriers. Multiple students reported near-misses. Immediate barricading + cover replacement critical.",
        "detected_class": "open_manhole",
        "yolo_confidence": 0.91,
        "image_key": "manhole_admin",
    },
    {
        "student_key": "demo_student3",
        "citizen_description": "Sports ground ke paas ek ped gir gaya hai — raaste par block hai aur bijli ki wire pe bhi pada hai. Jaldi hatao.",
        "raw_text": "Tree fallen near sports ground blocking pathway. Tree branch touching electrical wires. Immediate clearance required.",
        "latitude": Decimal("28.6340"),
        "longitude": Decimal("77.4480"),
        "campus_zone": "Sports Ground",
        "address": "Sports Ground, ABESEC Campus, Ghaziabad",
        "department": "SAFETY",
        "severity_score": 8,
        "is_emergency": True,
        "ai_summary": "Fallen tree blocking pedestrian pathway near sports complex. Branch in contact with overhead electrical wires. Dual hazard: access blockage + electrocution risk.",
        "detected_class": "fallen_tree",
        "yolo_confidence": 0.78,
        "image_key": "fallen_tree_sports",
    },
]

# Public domain / CC0 images from Wikimedia — Indian road/infrastructure defects
IMAGE_URLS = {
    "pothole_maingate": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Pothole_on_road.jpg/640px-Pothole_on_road.jpg",
    "streetlight_library": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Street_light_at_night.jpg/640px-Street_light_at_night.jpg",
    "pipe_burst_blockc": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Water_pipe_burst.jpg/640px-Water_pipe_burst.jpg",
    "garbage_cafeteria": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Garbage_bins_overflow.jpg/640px-Garbage_bins_overflow.jpg",
    "manhole_admin": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Open_manhole.jpg/640px-Open_manhole.jpg",
    "fallen_tree_sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Fallen_tree_blocking_road.jpg/640px-Fallen_tree_blocking_road.jpg",
}

# Fallback images — guaranteed to be accessible
FALLBACK_IMAGE_URLS = {
    "pothole_maingate": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Road_pothole_India.jpg/320px-Road_pothole_India.jpg",
    "streetlight_library": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Streetlight.jpg/320px-Streetlight.jpg",
    "pipe_burst_blockc": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Water_leak.jpg/320px-Water_leak.jpg",
    "garbage_cafeteria": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Garbage_heap_India.jpg/320px-Garbage_heap_India.jpg",
    "manhole_admin": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Open_manhole_India.jpg/320px-Open_manhole_India.jpg",
    "fallen_tree_sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Tree_fallen_road.jpg/320px-Tree_fallen_road.jpg",
}

DEMO_STUDENTS = [
    {
        "username": "demo_student1",
        "email": "demo.student1@abesec.ac.in",
        "first_name": "Arjun",
        "last_name": "Sharma",
        "roll_no": "2100320100045",
        "department": "Computer Science & Engineering",
    },
    {
        "username": "demo_student2",
        "email": "demo.student2@abesec.ac.in",
        "first_name": "Priya",
        "last_name": "Verma",
        "roll_no": "2100320100046",
        "department": "Electronics & Communication Engineering",
    },
    {
        "username": "demo_student3",
        "email": "demo.student3@abesec.ac.in",
        "first_name": "Rahul",
        "last_name": "Gupta",
        "roll_no": "2100320100047",
        "department": "Mechanical Engineering",
    },
]

DEMO_ADMIN = {
    "username": "demo_admin",
    "email": "demo.admin@abesec.ac.in",
    "first_name": "Dr. Amit",
    "last_name": "Saxena",
    "employee_id": "EMP-2026-1049",
    "department": "Administration & Infrastructure",
    "designation": "Chief Infrastructure Officer",
}


def _download_image(key: str, dest_dir: str) -> str | None:
    """Download image for given key, returns local file path or None on failure."""
    dest_path = os.path.join(dest_dir, f"{key}.jpg")
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        return dest_path  # already downloaded

    headers = {"User-Agent": "ACTS-Demo-Seeder/1.0 (educational project)"}
    tried = [IMAGE_URLS.get(key), FALLBACK_IMAGE_URLS.get(key)]

    for url in [u for u in tried if u]:
        try:
            r = requests.get(url, headers=headers, timeout=15, stream=True)
            if r.status_code == 200 and len(r.content) > 1000:
                with open(dest_path, "wb") as f:
                    f.write(r.content)
                return dest_path
        except Exception:
            continue

    # Last resort: generate a simple valid JPEG placeholder using Pillow if available
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new("RGB", (640, 480), color=(80, 80, 80))
        draw = ImageDraw.Draw(img)
        draw.rectangle([20, 20, 620, 460], outline=(200, 200, 200), width=3)
        draw.text((50, 200), f"ACTS Demo\n{key.replace('_', ' ').title()}\nABESEC Campus", fill=(255, 255, 255))
        img.save(dest_path, "JPEG", quality=85)
        return dest_path
    except Exception:
        return None


class Command(BaseCommand):
    help = "Seed 3 demo students + 1 demo admin with realistic complaints for ACTS demo showcase."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Wipe existing demo data and re-seed from scratch.",
        )

    def handle(self, *args, **options):
        # Import models here to avoid AppRegistryNotReady
        from complaints.models import (
            Complaint, ComplaintCluster, ComplaintStatus,
            DepartmentType, UserProfile,
        )
        from complaints.services.clustering_service import (
            cluster_and_weight_complaint, calculate_crowd_priority
        )
        from complaints.services.routing_engine import dispatch_cluster_to_crew

        force = options["force"]

        # ── 1. Wipe existing demo data if --force ──────────────────────────
        if force:
            demo_usernames = [s["username"] for s in DEMO_STUDENTS] + [DEMO_ADMIN["username"]]
            demo_users = User.objects.filter(username__in=demo_usernames)
            Complaint.objects.filter(user__in=demo_users).delete()
            ComplaintCluster.objects.filter(
                campus_zone__in=[c["campus_zone"] for c in COMPLAINTS_DATA]
            ).delete()
            UserProfile.objects.filter(user__in=demo_users).delete()
            demo_users.delete()
            self.stdout.write(self.style.WARNING("Wiped existing demo data."))

        seed_dir = os.path.join(settings.MEDIA_ROOT, "seed_images")
        os.makedirs(seed_dir, exist_ok=True)

        # ── 2. Download images ──────────────────────────────────────────────
        self.stdout.write("Downloading seed images...")
        local_images: dict[str, str | None] = {}
        for key in IMAGE_URLS:
            path = _download_image(key, seed_dir)
            local_images[key] = path
            status_str = "OK" if path else "FAIL (skipped)"
            self.stdout.write(f"  {status_str}  {key}")

        # ── 3. Create demo students ─────────────────────────────────────────
        student_user_map: dict[str, User] = {}
        for s in DEMO_STUDENTS:
            user, created = User.objects.get_or_create(
                username=s["username"],
                defaults={
                    "email": s["email"],
                    "first_name": s["first_name"],
                    "last_name": s["last_name"],
                    "is_active": True,
                    "is_staff": False,
                }
            )
            if created:
                user.set_unusable_password()
                user.save()

            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    "role": "student",
                    "roll_no": s["roll_no"],
                    "department": s["department"],
                    "designation": "Student",
                    "is_verified": True,
                }
            )
            student_user_map[s["username"]] = user
            action = "Created" if created else "Already exists"
            self.stdout.write(f"  {action}: {s['username']} (roll={s['roll_no']})")

        # ── 4. Create demo admin ────────────────────────────────────────────
        admin_user, created = User.objects.get_or_create(
            username=DEMO_ADMIN["username"],
            defaults={
                "email": DEMO_ADMIN["email"],
                "first_name": DEMO_ADMIN["first_name"],
                "last_name": DEMO_ADMIN["last_name"],
                "is_active": True,
                "is_staff": True,
                "is_superuser": False,
            }
        )
        if created:
            admin_user.set_unusable_password()
            admin_user.save()

        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                "role": "admin",
                "employee_id": DEMO_ADMIN["employee_id"],
                "department": DEMO_ADMIN["department"],
                "designation": DEMO_ADMIN["designation"],
                "is_verified": True,
            }
        )
        action = "Created" if created else "Already exists"
        self.stdout.write(f"  {action}: {DEMO_ADMIN['username']} (admin, employee_id={DEMO_ADMIN['employee_id']})")

        # ── 5. Create complaints and cluster them ───────────────────────────
        self.stdout.write("Creating demo complaints...")
        for comp_data in COMPLAINTS_DATA:
            student_username = comp_data["student_key"]
            user = student_user_map[student_username]

            # Skip if this complaint already exists for this user+zone
            existing = Complaint.objects.filter(
                user=user,
                campus_zone=comp_data["campus_zone"],
            ).first()
            if existing:
                self.stdout.write(f"  Skipping (exists): {comp_data['campus_zone']}")
                continue

            # Build complaint object (don't save yet — need to attach image)
            complaint = Complaint(
                user=user,
                user_identifier=user.username,
                citizen_description=comp_data["citizen_description"],
                raw_text=comp_data["raw_text"],
                latitude=comp_data["latitude"],
                longitude=comp_data["longitude"],
                campus_zone=comp_data["campus_zone"],
                address=comp_data["address"],
                department=comp_data["department"],
                assigned_department=comp_data["department"],
                severity_score=comp_data["severity_score"],
                initial_severity=comp_data["severity_score"],
                is_emergency=comp_data["is_emergency"],
                ai_summary=comp_data["ai_summary"],
                detected_class=comp_data["detected_class"],
                yolo_confidence=comp_data["yolo_confidence"],
                is_valid_image=True,
                blur_score=0.0,
                user_trust_score=1.0,
                status=ComplaintStatus.QUEUED,
                gemini_analysis={
                    "severity_score": comp_data["severity_score"],
                    "department": comp_data["department"],
                    "urgency": "HIGH" if comp_data["is_emergency"] else "MEDIUM",
                    "is_emergency": comp_data["is_emergency"],
                    "summary": comp_data["ai_summary"],
                    "title": comp_data["raw_text"][:60],
                },
            )
            complaint.save()

            # Attach image if downloaded
            img_path = local_images.get(comp_data["image_key"])
            if img_path and os.path.exists(img_path):
                with open(img_path, "rb") as f:
                    complaint.image.save(
                        f"seed_{comp_data['image_key']}.jpg",
                        File(f),
                        save=True,
                    )

            # Cluster it
            cluster, is_new = cluster_and_weight_complaint(complaint)
            complaint.cluster = cluster
            complaint.save(update_fields=["cluster"])

            if not cluster.assigned_crew:
                try:
                    dispatch_cluster_to_crew(cluster)
                except Exception:
                    pass  # crew dispatch is best-effort in seed context

            self.stdout.write(
                f"  OK [{student_username}] {comp_data['campus_zone']} "
                f"→ cluster={str(cluster.id)[:8]} (new={is_new})"
            )

        # ── 6. Summary ──────────────────────────────────────────────────────
        from complaints.models import Complaint as C, ComplaintCluster as CC
        total_complaints = C.objects.filter(user__username__in=[s["username"] for s in DEMO_STUDENTS]).count()
        total_clusters = CC.objects.count()

        self.stdout.write(self.style.SUCCESS(
            f"\nOK Demo seed complete.\n"
            f"  Students  : {len(DEMO_STUDENTS)} (demo_student1/2/3)\n"
            f"  Admin     : 1 (demo_admin, is_staff=True)\n"
            f"  Complaints: {total_complaints}\n"
            f"  Clusters  : {total_clusters}\n"
            f"\nDemo credentials:\n"
            f"  Students  → Roll No: 2100320100045 / 2100320100046 / 2100320100047\n"
            f"  Admin     → Employee ID: EMP-2026-1049\n"
            f"  (All accounts use Google OAuth — set password not needed)\n"
        ))

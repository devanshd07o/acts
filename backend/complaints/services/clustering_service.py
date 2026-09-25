import math
from decimal import Decimal
from typing import Optional, Tuple
from django.utils import timezone
from ..models import Complaint, ComplaintCluster, ComplaintStatus

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geographical distance in meters between two GPS coordinates."""
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def text_similarity_ratio(text1: str, text2: str) -> float:
    """Calculates Jaccard token similarity between two complaint descriptions."""
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)

def calculate_crowd_priority(base_severity: int, report_count: int) -> float:
    """
    Crowd-weight formula from Section 5.2:
    The more people affected and reporting, the higher its priority climbs.
    """
    crowd_boost = math.log2(max(1, report_count)) * 1.5
    total_priority = min(10.0, float(base_severity) + crowd_boost)
    return round(total_priority, 2)

def cluster_and_weight_complaint(
    complaint: Complaint,
    max_distance_meters: float = 75.0,
    min_similarity_threshold: float = 0.20
) -> Tuple[ComplaintCluster, bool]:
    """
    Checks whether this new complaint matches an existing open cluster in the same area & department.
    If matched: Merges report, increases crowd_report_count, and boosts computed priority.
    If not matched: Creates a fresh ComplaintCluster.
    """
    open_clusters = ComplaintCluster.objects.exclude(
        status__in=[ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]
    ).filter(department=complaint.department)

    matched_cluster: Optional[ComplaintCluster] = None

    for cluster in open_clusters:
        dist = calculate_haversine_distance(
            float(complaint.latitude), float(complaint.longitude),
            float(cluster.latitude), float(cluster.longitude)
        )

        # Check geographic proximity and campus zone
        same_zone = bool(complaint.campus_zone and cluster.campus_zone and complaint.campus_zone.strip().lower() == cluster.campus_zone.strip().lower())
        if dist <= max_distance_meters or same_zone:
            sim = text_similarity_ratio(complaint.raw_text, cluster.title)
            # If within 30 meters, strong text overlap, or identical campus zone
            if dist <= 30.0 or sim >= min_similarity_threshold or same_zone:
                matched_cluster = cluster
                break

    if matched_cluster:
        # Merge into existing cluster
        complaint.cluster = matched_cluster
        matched_cluster.crowd_report_count += 1
        matched_cluster.computed_priority = calculate_crowd_priority(
            matched_cluster.base_severity,
            matched_cluster.crowd_report_count
        )
        matched_cluster.save()
        is_new_cluster = False
    else:
        # Create new cluster
        title = complaint.gemini_analysis.get('title') or complaint.raw_text[:60] or "Campus Infrastructure Defect"
        matched_cluster = ComplaintCluster.objects.create(
            title=title,
            department=complaint.department,
            campus_zone=complaint.campus_zone or complaint.address or "Main Campus",
            latitude=complaint.latitude,
            longitude=complaint.longitude,
            base_severity=complaint.initial_severity,
            crowd_report_count=1,
            computed_priority=float(complaint.initial_severity),
            status=ComplaintStatus.QUEUED
        )
        complaint.cluster = matched_cluster
        is_new_cluster = True

    return matched_cluster, is_new_cluster

class ComplaintModel {
  final String id;
  final String userIdentifier;
  final String rawText;
  final String? imageUrl;
  final String? compressedImageUrl;
  final double latitude;
  final double longitude;
  final String campusZone;
  final String address;
  final String department;
  final int initialSeverity;
  final double blurScore;
  final bool isValidImage;
  final Map<String, dynamic> yoloDetections;
  final Map<String, dynamic> geminiAnalysis;
  final String? clusterId;
  final int crowdReportCount;
  final double computedPriority;
  final String? assignedCrewName;
  final String status;
  final bool? isConfirmedByReporter;
  final String reporterFeedback;
  final String adminNotes;
  final String facultySupervisor;
  final String studentLead;
  final String committeeNotes;
  final DateTime createdAt;

  ComplaintModel({
    required this.id,
    required this.userIdentifier,
    required this.rawText,
    this.imageUrl,
    this.compressedImageUrl,
    required this.latitude,
    required this.longitude,
    required this.campusZone,
    required this.address,
    required this.department,
    required this.initialSeverity,
    required this.blurScore,
    required this.isValidImage,
    required this.yoloDetections,
    required this.geminiAnalysis,
    this.clusterId,
    this.crowdReportCount = 1,
    this.computedPriority = 1.0,
    this.assignedCrewName,
    required this.status,
    this.isConfirmedByReporter,
    required this.reporterFeedback,
    required this.adminNotes,
    this.facultySupervisor = '',
    this.studentLead = '',
    this.committeeNotes = '',
    required this.createdAt,
  });

  factory ComplaintModel.fromJson(Map<String, dynamic> json) {
    final clusterData = json['cluster_details'] is Map ? json['cluster_details'] : {};
    final crewData = json['crew_details'] is Map ? json['crew_details'] : {};

    return ComplaintModel(
      id: json['id'] ?? '',
      userIdentifier: json['user_identifier'] ?? '',
      rawText: json['raw_text'] ?? '',
      imageUrl: json['image'],
      compressedImageUrl: json['compressed_image'],
      latitude: double.tryParse(json['latitude']?.toString() ?? '0.0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0.0') ?? 0.0,
      campusZone: json['campus_zone'] ?? '',
      address: json['address'] ?? '',
      department: json['department'] ?? 'GENERAL',
      initialSeverity: json['initial_severity'] ?? 5,
      blurScore: (json['blur_score'] as num?)?.toDouble() ?? 0.0,
      isValidImage: json['is_valid_image'] ?? true,
      yoloDetections: json['yolo_detections'] is Map ? Map<String, dynamic>.from(json['yolo_detections']) : {},
      geminiAnalysis: json['gemini_analysis'] is Map ? Map<String, dynamic>.from(json['gemini_analysis']) : {},
      clusterId: json['cluster'],
      crowdReportCount: clusterData['crowd_report_count'] ?? 1,
      computedPriority: (clusterData['computed_priority'] as num?)?.toDouble() ?? (json['initial_severity'] as num?)?.toDouble() ?? 5.0,
      assignedCrewName: crewData['name'],
      status: json['status'] ?? 'SUBMITTED',
      isConfirmedByReporter: json['is_confirmed_by_reporter'],
      reporterFeedback: json['reporter_feedback'] ?? '',
      adminNotes: json['admin_notes'] ?? '',
      facultySupervisor: json['faculty_supervisor'] ?? clusterData['faculty_supervisor'] ?? '',
      studentLead: json['student_lead'] ?? clusterData['student_lead'] ?? '',
      committeeNotes: json['committee_notes'] ?? clusterData['committee_notes'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
    );
  }
}

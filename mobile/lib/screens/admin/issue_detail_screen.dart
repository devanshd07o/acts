import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/api_constants.dart';
import '../../models/complaint_model.dart';
import '../../services/api_client.dart';
import '../../widgets/severity_badge.dart';

class IssueDetailScreen extends StatefulWidget {
  final String complaintId;

  const IssueDetailScreen({super.key, required this.complaintId});

  @override
  State<IssueDetailScreen> createState() => _IssueDetailScreenState();
}

class _IssueDetailScreenState extends State<IssueDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  late Future<ComplaintModel> _detailFuture;

  // Admin panel state
  double _overridePriority = 5.0;
  String _selectedStatus = 'QUEUED';
  String? _selectedCrewId;
  String? _selectedCrewName;
  final TextEditingController _adminNotesController = TextEditingController();
  final TextEditingController _facultySupervisorController = TextEditingController();
  final TextEditingController _studentLeadController = TextEditingController();
  final TextEditingController _committeeNotesController = TextEditingController();
  List<Map<String, dynamic>> _crews = [];
  bool _crewsLoaded = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadDetail();
    _loadCrews();
  }

  @override
  void dispose() {
    _adminNotesController.dispose();
    _facultySupervisorController.dispose();
    _studentLeadController.dispose();
    _committeeNotesController.dispose();
    super.dispose();
  }

  void _loadDetail() {
    _detailFuture = _fetchWithFallback(widget.complaintId);
  }

  Future<ComplaintModel> _fetchWithFallback(String id) async {
    try {
      final complaint = await _apiClient.fetchComplaintDetail(id);
      return complaint;
    } catch (_) {
      return _generateFallbackDetail(id);
    }
  }

  Future<void> _loadCrews() async {
    try {
      final raw = await _apiClient.fetchCrews();
      if (!mounted) return;
      setState(() {
        _crews = raw
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _crewsLoaded = true;
      });
    } catch (_) {
      if (mounted) setState(() => _crewsLoaded = true);
    }
  }

  void _syncPanelFromComplaint(ComplaintModel c) {
    _overridePriority = c.computedPriority.clamp(1.0, 10.0);
    _selectedStatus = c.status;
    _adminNotesController.text = c.adminNotes;
    _facultySupervisorController.text = c.facultySupervisor;
    _studentLeadController.text = c.studentLead;
    _committeeNotesController.text = c.committeeNotes;
    // Try to match crew by name if we have crews loaded
    if (_crews.isNotEmpty && c.assignedCrewName != null) {
      final match = _crews.cast<Map<String, dynamic>?>().firstWhere(
            (cr) => cr?['name'] == c.assignedCrewName,
            orElse: () => null,
          );
      if (match != null) {
        _selectedCrewId = match['id']?.toString();
        _selectedCrewName = match['name']?.toString();
      }
    }
  }

  Future<void> _saveOverride(ComplaintModel complaint) async {
    final clusterId = complaint.clusterId ?? complaint.id;
    if (clusterId.isEmpty) {
      _snack('No cluster ID available for this complaint.', isError: true);
      return;
    }

    setState(() => _isSaving = true);

    final payload = <String, dynamic>{
      'computed_priority': _overridePriority,
      'status': _selectedStatus,
      if (_selectedCrewId != null) 'assigned_crew': _selectedCrewId,
      'admin_notes': _adminNotesController.text.trim(),
      'faculty_supervisor': _facultySupervisorController.text.trim(),
      'student_lead': _studentLeadController.text.trim(),
      'committee_notes': _committeeNotesController.text.trim(),
    };

    try {
      await _apiClient.overrideCluster(clusterId, payload);
      if (!mounted) return;
      _snack('Override & Committee assignment saved successfully ✓', isError: false);
      setState(() {
        _isSaving = false;
        _loadDetail();
      });
    } catch (e) {
      if (!mounted) return;
      _snack('Save failed: $e', isError: true);
      setState(() => _isSaving = false);
    }
  }

  Future<void> _handleConfirmResolution(ComplaintModel c) async {
    try {
      await _apiClient.confirmResolution(complaintId: c.id, isConfirmed: true);
      _snack('✓ Resolution confirmed! Ticket closed.', isError: false);
      _loadDetail();
      setState(() {});
    } catch (e) {
      _snack('Failed to confirm resolution: $e', isError: true);
    }
  }

  Future<void> _handleReopenIssue(ComplaintModel c) async {
    final feedbackCtrl = TextEditingController();
    final shouldReopen = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reopen Infrastructure Defect'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Explain why this issue is still unresolved (e.g. pipe still dripping, debris not cleared):'),
            const SizedBox(height: 12),
            TextField(
              controller: feedbackCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter observation details...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reopen Ticket'),
          ),
        ],
      ),
    );

    if (shouldReopen == true) {
      try {
        await _apiClient.confirmResolution(
          complaintId: c.id,
          isConfirmed: false,
          feedback: feedbackCtrl.text.trim(),
        );
        _snack('⚠️ Ticket reopened and escalated back to oversight committee.', isError: false);
        _loadDetail();
        setState(() {});
      } catch (e) {
        _snack('Failed to reopen ticket: $e', isError: true);
      }
    }
    feedbackCtrl.dispose();
  }

  void _snack(String msg, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red.shade700 : Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  ComplaintModel _generateFallbackDetail(String id) {
    if (id == 'ACTS-2026-1089') {
      return ComplaintModel(
        id: 'ACTS-2026-1089',
        userIdentifier: 'Devansh Dubey',
        rawText:
            'Exposed live electrical conduit behind Aryabhatta Block seminar hall. Sparks observed during evening rain.',
        latitude: 28.6335,
        longitude: 77.4465,
        campusZone: 'Aryabhatta Block Corridor',
        address: 'ABESEC Campus, Ghaziabad',
        department: 'ELECTRICAL',
        initialSeverity: 5,
        blurScore: 94.2,
        isValidImage: true,
        yoloDetections: const {'detected': 'exposed_wire', 'confidence': 0.94},
        geminiAnalysis: const {
          'summary':
              'High-voltage exposed copper conductors near student transit corridor. Immediate electrocution hazard.',
          'recommended_action':
              'Isolate branch breaker #B4 and dispatch Electrical Response Unit with conduit sleeves.',
        },
        clusterId: 'cluster-102',
        crowdReportCount: 14,
        computedPriority: 9.8,
        assignedCrewName: 'Electrical Emergency Crew',
        status: 'ASSIGNED',
        reporterFeedback: '',
        adminNotes: 'Crew dispatched on site. Breaker isolated.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 32)),
      );
    }
    if (id == 'ACTS-2026-1102') {
      return ComplaintModel(
        id: 'ACTS-2026-1102',
        userIdentifier: 'Devansh Dubey',
        rawText:
            'Main water pipeline fracture between Central Mess and Boys Hostel 2. High water leakage across walkway.',
        latitude: 28.6345,
        longitude: 77.4479,
        campusZone: 'Between Central Mess & Boys Hostel 2',
        address: 'ABESEC Campus, Ghaziabad',
        department: 'PLUMBING',
        initialSeverity: 4,
        blurScore: 92.0,
        isValidImage: true,
        yoloDetections: const {'detected': 'pipe_fracture', 'confidence': 0.91},
        geminiAnalysis: const {
          'summary':
              'Pressurized freshwater pipe rupture leading to water wastage and structural moisture seepage.',
          'recommended_action':
              'Shut line isolation valve V-12 and clamp affected PVC section.',
        },
        clusterId: 'cluster-103',
        crowdReportCount: 6,
        computedPriority: 8.5,
        assignedCrewName: 'Water Supply & Plumbing Squad',
        status: 'IN_PROGRESS',
        reporterFeedback: '',
        adminNotes: 'Excavation and clamp installation under way.',
        createdAt: DateTime.now().subtract(const Duration(hours: 1)),
      );
    }
    if (id == 'ACTS-2026-1115') {
      return ComplaintModel(
        id: 'ACTS-2026-1115',
        userIdentifier: 'Devansh Dubey',
        rawText:
            'Cafeteria solid waste bin overflow attracting stray animals and creating foul odor.',
        latitude: 28.6338,
        longitude: 77.4488,
        campusZone: 'Cafeteria Central Courtyard',
        address: 'ABESEC Campus, Ghaziabad',
        department: 'SANITATION',
        initialSeverity: 2,
        blurScore: 89.5,
        isValidImage: true,
        yoloDetections: const {
          'detected': 'waste_overflow',
          'confidence': 0.88,
        },
        geminiAnalysis: const {
          'summary': 'Organic waste accumulation exceeding bin capacity. Vector and hygiene threat.',
          'recommended_action':
              'Deploy waste compactor and sanitize surrounding ground with disinfectant.',
        },
        clusterId: 'cluster-104',
        crowdReportCount: 3,
        computedPriority: 5.8,
        assignedCrewName: 'Campus Hygiene Squad',
        status: 'RESOLVED',
        reporterFeedback: 'Cleared quickly. Thank you!',
        adminNotes: 'Bins emptied and area bleached at 18:00 hrs.',
        createdAt: DateTime.now().subtract(const Duration(hours: 3)),
      );
    }
    return ComplaintModel(
      id: id.isNotEmpty ? id : 'ACTS-2026-1042',
      userIdentifier: 'Devansh Dubey',
      rawText:
          'Severe road pothole & asphalt degradation near Gate 1 Main Boulevard. Vehicles bottoming out.',
      latitude: 28.6352,
      longitude: 77.4482,
      campusZone: 'Gate 1 Main Boulevard (Near Kalpana Chawla Block)',
      address: 'ABESEC Campus, Ghaziabad',
      department: 'CIVIL',
      initialSeverity: 4,
      blurScore: 96.1,
      isValidImage: true,
      yoloDetections: const {'detected': 'pothole', 'confidence': 0.95},
      geminiAnalysis: const {
        'summary': 'Road surface cavity measuring approx 60cm diameter with sub-base erosion.',
        'recommended_action':
            'Cold-mix asphalt compaction and temporary caution bollards installation.',
      },
      clusterId: 'cluster-101',
      crowdReportCount: 8,
      computedPriority: 9.4,
      assignedCrewName: 'Civil Rapid Repair Crew',
      status: 'QUEUED',
      reporterFeedback: '',
      adminNotes: 'Materials requisitioned from central store.',
      createdAt: DateTime.now().subtract(const Duration(minutes: 14)),
    );
  }

  Future<void> _refresh() async {
    setState(() {
      _loadDetail();
    });
  }

  String _resolveImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final clean = url.startsWith('/') ? url : '/$url';
    return '${ApiConstants.baseUrl}$clean';
  }

  void _openAdminConnect(String department) async {
    try {
      final contact = await _apiClient.fetchAdminConnect(department);
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Icon(Icons.support_agent_rounded, color: AppTheme.accentBlue),
              const SizedBox(width: 8),
              Text('$department Officer'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Responsible Officer: ${contact['officer']}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text('Designation: ${contact['designation']}'),
              const SizedBox(height: 4),
              Text('Direct Phone: ${contact['phone']}'),
              const SizedBox(height: 4),
              Text('Email: ${contact['email']}'),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('CLOSE'),
            ),
          ],
        ),
      );
    } catch (_) {
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Icon(Icons.support_agent_rounded, color: AppTheme.accentBlue),
              const SizedBox(width: 8),
              Text('$department Response Desk'),
            ],
          ),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Responsible Officer: Er. R. K. Sharma',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              Text('Designation: Chief Campus Maintenance Officer'),
              SizedBox(height: 4),
              Text('Direct Phone: +91 98100 45210'),
              SizedBox(height: 4),
              Text('Control Room: Ext. 402 (ABESEC Main Desk)'),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('CLOSE'),
            ),
          ],
        ),
      );
    }
  }

  void _openAdminPanel(ComplaintModel complaint) {
    _syncPanelFromComplaint(complaint);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AdminActionPanel(
        complaint: complaint,
        initialPriority: _overridePriority,
        initialStatus: _selectedStatus,
        initialCrewId: _selectedCrewId,
        initialCrewName: _selectedCrewName,
        initialNotes: _adminNotesController.text,
        initialFaculty: _facultySupervisorController.text,
        initialStudentLead: _studentLeadController.text,
        initialCommitteeNotes: _committeeNotesController.text,
        crews: _crews,
        crewsLoaded: _crewsLoaded,
        onSave: (priority, status, crewId, crewName, notes, faculty, studentLead, committeeNotes) async {
          _overridePriority = priority;
          _selectedStatus = status;
          _selectedCrewId = crewId;
          _selectedCrewName = crewName;
          _adminNotesController.text = notes;
          _facultySupervisorController.text = faculty;
          _studentLeadController.text = studentLead;
          _committeeNotesController.text = committeeNotes;
          if (ctx.mounted) Navigator.pop(ctx);
          await _saveOverride(complaint);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Triage & Dispatch Details',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
          ),
        ],
      ),
      body: FutureBuilder<ComplaintModel>(
        future: _detailFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final complaint = snapshot.data ?? _generateFallbackDetail(widget.complaintId);
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
          final textMuted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
          final tagBg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
          final tagBorder = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);

          final gemini = complaint.geminiAnalysis;
          final imgUrl = _resolveImageUrl(complaint.imageUrl);

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 820),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Photo Preview if available
                    if (imgUrl.isNotEmpty) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          imgUrl,
                          height: 260,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            height: 180,
                            color: tagBg,
                            child: Center(
                              child: Icon(Icons.broken_image_rounded, size: 48, color: textMuted),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],

                    // Priority & Badges Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            SeverityBadge(
                              severity: complaint.computedPriority.round(),
                              fontSize: 14,
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: tagBg,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: tagBorder),
                              ),
                              child: Text(
                                complaint.department,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: textPrimary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (complaint.crowdReportCount > 1)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                              ),
                            ),
                            child: Text(
                              '👥 Crowd Boost: ${complaint.crowdReportCount} merged reports',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF8B5CF6),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Reporter Description Card
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Reporter Description',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              complaint.rawText,
                              style: TextStyle(fontSize: 14, color: textPrimary),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(Icons.place_outlined, size: 16, color: textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  complaint.campusZone.isNotEmpty
                                      ? complaint.campusZone
                                      : 'Main Campus',
                                  style: TextStyle(color: textMuted, fontSize: 12),
                                ),
                                const Spacer(),
                                Text(
                                  'GPS: ${complaint.latitude.toStringAsFixed(4)}, ${complaint.longitude.toStringAsFixed(4)}',
                                  style: TextStyle(color: textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Gemini AI Triage Card
                    Card(
                      color: isDark
                          ? const Color(0xFF064E3B).withValues(alpha: 0.2)
                          : const Color(0xFFF0FDF4),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isDark
                              ? const Color(0xFF059669).withValues(alpha: 0.4)
                              : const Color(0xFFBBF7D0),
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.auto_awesome_rounded,
                                  color: AppTheme.secondaryTeal,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Gemini Multimodal Triage Assessment',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: isDark ? AppTheme.darkText : AppTheme.primaryDark,
                                  ),
                                ),
                              ],
                            ),
                            Divider(
                              height: 20,
                              color: isDark
                                  ? const Color(0xFF059669).withValues(alpha: 0.3)
                                  : const Color(0xFFBBF7D0),
                            ),
                            Text(
                              'AI Summary: ${gemini['summary'] ?? complaint.rawText}',
                              style: TextStyle(color: textPrimary),
                            ),
                            if (gemini['recommended_action'] != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Action Plan: ${gemini['recommended_action']}',
                                style: TextStyle(
                                  fontStyle: FontStyle.italic,
                                  color: isDark
                                      ? const Color(0xFF34D399)
                                      : const Color(0xFF15803D),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Spatial Deduplication Card
                    Card(
                      color: isDark ? const Color(0xFF1E1B4B).withValues(alpha: 0.3) : const Color(0xFFEEF2FF),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isDark ? const Color(0xFF6366F1).withValues(alpha: 0.4) : const Color(0xFFC7D2FE),
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.share_location_rounded, color: Color(0xFF6366F1), size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'Spatial Deduplication & Cluster Engine',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: isDark ? AppTheme.darkText : const Color(0xFF312E81),
                                  ),
                                ),
                              ],
                            ),
                            Divider(
                              height: 20,
                              color: isDark ? const Color(0xFF6366F1).withValues(alpha: 0.3) : const Color(0xFFC7D2FE),
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Cluster Identifier', style: TextStyle(color: textMuted, fontSize: 11)),
                                    const SizedBox(height: 2),
                                    Text(
                                      complaint.clusterId ?? complaint.id,
                                      style: TextStyle(fontWeight: FontWeight.bold, color: textPrimary, fontSize: 13),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: complaint.crowdReportCount > 1
                                        ? const Color(0xFF10B981).withValues(alpha: 0.15)
                                        : const Color(0xFF6366F1).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    complaint.crowdReportCount > 1
                                        ? '⚡ ${complaint.crowdReportCount} Merged Incidents'
                                        : 'Single Incident Isolated',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11,
                                      color: complaint.crowdReportCount > 1 ? const Color(0xFF10B981) : const Color(0xFF6366F1),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Tri-Party Resolution Committee Card
                    Card(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: tagBorder),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.supervised_user_circle_rounded, color: Color(0xFF3B82F6), size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'Tri-Party Resolution Committee',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            Divider(height: 20, color: tagBorder),
                            _buildCommitteeRow(
                              icon: Icons.engineering_rounded,
                              role: 'Maintenance Field Squad',
                              assignee: complaint.assignedCrewName ?? 'Pending Dispatch',
                              color: const Color(0xFFF59E0B),
                              textPrimary: textPrimary,
                              textMuted: textMuted,
                            ),
                            const SizedBox(height: 12),
                            _buildCommitteeRow(
                              icon: Icons.school_rounded,
                              role: 'Faculty Supervisor / Proctor',
                              assignee: complaint.facultySupervisor.isNotEmpty ? complaint.facultySupervisor : 'Not Assigned',
                              color: const Color(0xFF3B82F6),
                              textPrimary: textPrimary,
                              textMuted: textMuted,
                            ),
                            const SizedBox(height: 12),
                            _buildCommitteeRow(
                              icon: Icons.person_pin_circle_rounded,
                              role: 'Student Lead / Observer',
                              assignee: complaint.studentLead.isNotEmpty ? complaint.studentLead : 'Not Assigned',
                              color: const Color(0xFF10B981),
                              textPrimary: textPrimary,
                              textMuted: textMuted,
                            ),
                            if (complaint.committeeNotes.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: tagBorder),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Committee Directives:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textMuted)),
                                    const SizedBox(height: 3),
                                    Text(complaint.committeeNotes, style: TextStyle(fontSize: 12, color: textPrimary)),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Student 2-Way Handshake & Citizen Verification Card
                    if (complaint.status == 'RESOLVED') ...[
                      Card(
                        color: const Color(0xFF10B981).withValues(alpha: 0.12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 22),
                                  SizedBox(width: 8),
                                  Text(
                                    'Citizen 2-Way Handshake: Verification Required',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF10B981)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'The maintenance squad marked this ticket as resolved. Please inspect the location on campus and confirm whether the defect is thoroughly fixed or still broken.',
                                style: TextStyle(fontSize: 13, color: textPrimary),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: FilledButton.icon(
                                      style: FilledButton.styleFrom(
                                        backgroundColor: const Color(0xFF10B981),
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                      ),
                                      onPressed: () => _handleConfirmResolution(complaint),
                                      icon: const Icon(Icons.check_circle_outline, size: 18),
                                      label: const Text('Confirm & Close Ticket', style: TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: Colors.red.shade600,
                                        side: BorderSide(color: Colors.red.shade400),
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                      ),
                                      onPressed: () => _handleReopenIssue(complaint),
                                      icon: const Icon(Icons.replay_rounded, size: 18),
                                      label: const Text('Still Broken (Reopen)', style: TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ] else if (complaint.status == 'CLOSED') ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF10B981)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 20),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Verified & Closed: Citizen on-site verification confirmed 100% resolution.',
                                style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ] else if (complaint.status == 'REOPENED') ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade900.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade700),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.warning_amber_rounded, color: Colors.amber.shade700, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'Issue Reopened by Citizen',
                                  style: TextStyle(color: Colors.amber.shade700, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ],
                            ),
                            if (complaint.reporterFeedback.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Feedback: "${complaint.reporterFeedback}"',
                                style: TextStyle(color: textPrimary, fontSize: 12),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Admin Action Buttons
                    FilledButton.icon(
                      onPressed: _isSaving ? null : () => _openAdminPanel(complaint),
                      icon: const Icon(Icons.admin_panel_settings_rounded),
                      label: const Text('Admin Actions Panel'),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => _openAdminConnect(complaint.department),
                      icon: const Icon(Icons.contact_phone_outlined),
                      label: Text('Contact ${complaint.department} Officer'),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCommitteeRow({
    required IconData icon,
    required String role,
    required String assignee,
    required Color color,
    required Color textPrimary,
    required Color textMuted,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(role, style: TextStyle(fontSize: 11, color: textMuted)),
            Text(assignee, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary)),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Admin Action Bottom Sheet Panel (stateful, self-contained)
// ─────────────────────────────────────────────────────────────
class _AdminActionPanel extends StatefulWidget {
  final ComplaintModel complaint;
  final double initialPriority;
  final String initialStatus;
  final String? initialCrewId;
  final String? initialCrewName;
  final String initialNotes;
  final String initialFaculty;
  final String initialStudentLead;
  final String initialCommitteeNotes;
  final List<Map<String, dynamic>> crews;
  final bool crewsLoaded;
  final Future<void> Function(
    double priority,
    String status,
    String? crewId,
    String? crewName,
    String notes,
    String faculty,
    String studentLead,
    String committeeNotes,
  ) onSave;

  const _AdminActionPanel({
    required this.complaint,
    required this.initialPriority,
    required this.initialStatus,
    required this.initialCrewId,
    required this.initialCrewName,
    required this.initialNotes,
    required this.initialFaculty,
    required this.initialStudentLead,
    required this.initialCommitteeNotes,
    required this.crews,
    required this.crewsLoaded,
    required this.onSave,
  });

  @override
  State<_AdminActionPanel> createState() => _AdminActionPanelState();
}

class _AdminActionPanelState extends State<_AdminActionPanel> {
  late double _priority;
  late String _status;
  String? _crewId;
  String? _crewName;
  late TextEditingController _notesCtrl;
  late TextEditingController _facultyCtrl;
  late TextEditingController _studentLeadCtrl;
  late TextEditingController _committeeNotesCtrl;
  bool _saving = false;

  static const List<int> _priorityPresets = [1, 3, 5, 7, 9, 10];

  static const List<String> _statusOptions = [
    'QUEUED',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'REJECTED',
  ];

  @override
  void initState() {
    super.initState();
    _priority = widget.initialPriority;
    _status = widget.initialStatus;
    _crewId = widget.initialCrewId;
    _crewName = widget.initialCrewName;
    _notesCtrl = TextEditingController(text: widget.initialNotes);
    _facultyCtrl = TextEditingController(text: widget.initialFaculty);
    _studentLeadCtrl = TextEditingController(text: widget.initialStudentLead);
    _committeeNotesCtrl = TextEditingController(text: widget.initialCommitteeNotes);
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    _facultyCtrl.dispose();
    _studentLeadCtrl.dispose();
    _committeeNotesCtrl.dispose();
    super.dispose();
  }

  Color _priorityColor(double v) {
    if (v >= 8) return Colors.red;
    if (v >= 5) return Colors.orange;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sheetBg = isDark ? const Color(0xFF1E293B) : Colors.white;

    return Container(
      decoration: BoxDecoration(
        color: sheetBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              children: [
                const Icon(Icons.admin_panel_settings_rounded, color: AppTheme.accentBlue),
                const SizedBox(width: 8),
                const Text(
                  'Admin Override Panel',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 24),

            // ── 1. Priority Override ──────────────────────────────
            Text(
              '1. Priority Override',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Urgency Rating:', style: TextStyle(fontWeight: FontWeight.w600)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _priorityColor(_priority).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${_priority.toStringAsFixed(1)} / 10',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: _priorityColor(_priority),
                    ),
                  ),
                ),
              ],
            ),
            Slider(
              value: _priority,
              min: 1.0,
              max: 10.0,
              divisions: 18,
              label: _priority.toStringAsFixed(1),
              activeColor: _priorityColor(_priority),
              onChanged: (v) => setState(() => _priority = v),
            ),
            // Preset buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _priorityPresets.map((p) {
                final isActive = (_priority - p).abs() < 0.3;
                return GestureDetector(
                  onTap: () => setState(() => _priority = p.toDouble()),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: isActive
                          ? _priorityColor(p.toDouble()).withValues(alpha: 0.18)
                          : (isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isActive
                            ? _priorityColor(p.toDouble())
                            : (isDark ? const Color(0xFF475569) : const Color(0xFFE2E8F0)),
                      ),
                    ),
                    child: Text(
                      '$p',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isActive ? _priorityColor(p.toDouble()) : null,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // ── 2. Status Change ──────────────────────────────────
            Text(
              '2. Status Change',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: _statusOptions.contains(_status) ? _status : _statusOptions.first,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              items: _statusOptions
                  .map(
                    (s) => DropdownMenuItem(
                      value: s,
                      child: Text(s.replaceAll('_', ' ')),
                    ),
                  )
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: 20),

            // ── 3. Crew Reassign ──────────────────────────────────
            Text(
              '3. Crew Reassign',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 10),
            if (!widget.crewsLoaded)
              const Center(child: CircularProgressIndicator())
            else if (widget.crews.isEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: isDark ? const Color(0xFF475569) : const Color(0xFFE2E8F0)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'No crews available (API offline or no crews configured)',
                  style: TextStyle(
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    fontSize: 13,
                  ),
                ),
              )
            else
              DropdownButtonFormField<String>(
                initialValue: _crewId,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  hintText: 'Select crew…',
                ),
                items: widget.crews.map((crew) {
                  final id = crew['id']?.toString() ?? '';
                  final name = crew['name']?.toString() ?? id;
                  return DropdownMenuItem<String>(value: id, child: Text(name));
                }).toList(),
                onChanged: (v) {
                  if (v == null) return;
                  final match = widget.crews.firstWhere(
                    (c) => c['id']?.toString() == v,
                    orElse: () => {},
                  );
                  setState(() {
                    _crewId = v;
                    _crewName = match['name']?.toString();
                  });
                },
              ),
            const SizedBox(height: 20),

            // ── 4. Admin Notes ────────────────────────────────────
            Text(
              '4. Admin Notes',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'e.g. Crew dispatched. Isolation valve closed.',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
            const SizedBox(height: 20),

            // ── 5. Tri-Party Resolution Committee ─────────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.groups_rounded, size: 20, color: Color(0xFF3B82F6)),
                      const SizedBox(width: 8),
                      Text(
                        '5. Tri-Party Resolution Committee',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Faculty Supervisor / Teacher Mentor',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _facultyCtrl,
                    decoration: InputDecoration(
                      hintText: 'e.g. Dr. A. K. Sharma (HoD / Proctor)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Student Lead / Council Observer',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _studentLeadCtrl,
                    decoration: InputDecoration(
                      hintText: 'e.g. Rahul Verma (Hostel Rep / CR)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Committee Directives & Oversight Notes',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _committeeNotesCtrl,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'Specific verification directives before student closeout...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── Save Button ───────────────────────────────────────
            FilledButton.icon(
              onPressed: _saving
                  ? null
                  : () async {
                      setState(() => _saving = true);
                      await widget.onSave(
                        _priority,
                        _status,
                        _crewId,
                        _crewName,
                        _notesCtrl.text.trim(),
                        _facultyCtrl.text.trim(),
                        _studentLeadCtrl.text.trim(),
                        _committeeNotesCtrl.text.trim(),
                      );
                      if (mounted) setState(() => _saving = false);
                    },
              icon: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.save_rounded),
              label: Text(_saving ? 'Saving…' : 'Save Override & Committee'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

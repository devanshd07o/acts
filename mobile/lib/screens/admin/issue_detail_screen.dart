import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/complaint_model.dart';
import '../../services/api_client.dart';
import '../../widgets/severity_badge.dart';

class IssueDetailScreen extends StatefulWidget {
  final String complaintId;

  const IssueDetailScreen({Key? key, required this.complaintId}) : super(key: key);

  @override
  State<IssueDetailScreen> createState() => _IssueDetailScreenState();
}

class _IssueDetailScreenState extends State<IssueDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  late Future<ComplaintModel> _detailFuture;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  void _loadDetail() {
    _detailFuture = _apiClient.fetchComplaintDetail(widget.complaintId);
  }

  Future<void> _refresh() async {
    setState(() {
      _loadDetail();
    });
  }

  void _showPriorityOverrideDialog(ComplaintModel complaint) {
    double selectedScore = complaint.computedPriority;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Manual Priority Override'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Current Priority: ${selectedScore.toStringAsFixed(1)}/10', style: const TextStyle(fontWeight: FontWeight.bold)),
              Slider(
                value: selectedScore,
                min: 1.0,
                max: 10.0,
                divisions: 9,
                label: selectedScore.toStringAsFixed(0),
                onChanged: (val) => setDialogState(() => selectedScore = val),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                if (complaint.clusterId != null) {
                  try {
                    await _apiClient.overridePriority(
                      clusterId: complaint.clusterId!,
                      newPriority: selectedScore,
                    );
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Priority adjusted to ${selectedScore.toStringAsFixed(0)}/10')),
                    );
                    _refresh();
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed to override priority: $e'), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              child: const Text('SAVE OVERRIDE'),
            ),
          ],
        ),
      ),
    );
  }

  void _openAdminConnect(String department) async {
    try {
      final contact = await _apiClient.fetchAdminConnect(department);
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              const Icon(Icons.support_agent, color: AppTheme.primaryBlue),
              SizedBox(width: 8),
              Text('$department Officer'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Responsible Officer: ${contact['officer']}', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Designation: ${contact['designation']}'),
              const SizedBox(height: 4),
              Text('Direct Phone: ${contact['phone']}'),
              const SizedBox(height: 4),
              Text('Email: ${contact['email']}'),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CLOSE')),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not fetch directory contact: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Triage & Dispatch Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refresh,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<ComplaintModel>(
          future: _detailFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 12),
                    Text('Error loading ticket: ${snapshot.error}'),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _refresh, child: const Text('Retry')),
                  ],
                ),
              );
            }

            final complaint = snapshot.data!;
            final gemini = complaint.geminiAnalysis;

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                if (complaint.imageUrl != null && complaint.imageUrl!.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(complaint.imageUrl!, height: 220, fit: BoxFit.cover),
                  ),
                const SizedBox(height: 16),

                // Priority & Crowd Indicators
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SeverityBadge(severity: complaint.computedPriority.round(), fontSize: 14),
                    if (complaint.crowdReportCount > 1)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.purple.shade300),
                        ),
                        child: Text(
                          '🔥 Crowd Boost: ${complaint.crowdReportCount} merged reports',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.purple.shade800),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),

                // Plain-text Description
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade300)),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Reporter Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 6),
                        Text(complaint.rawText, style: const TextStyle(fontSize: 14, color: AppTheme.textDark)),
                        const SizedBox(height: 8),
                        Text('Campus Zone: ${complaint.campusZone.isNotEmpty ? complaint.campusZone : "Campus"}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Gemini AI Triage Card
                Card(
                  elevation: 0,
                  color: Colors.blue.shade50,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.blue.shade200)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: AppTheme.primaryBlue, size: 20),
                            SizedBox(width: 8),
                            Text('Gemini AI Triage Assessment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.primaryBlue)),
                          ],
                        ),
                        const Divider(height: 20),
                        Text('Department: ${complaint.department}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('AI Summary: ${gemini['summary'] ?? complaint.rawText}'),
                        if (gemini['recommended_action'] != null) ...[
                          const SizedBox(height: 6),
                          Text('Action Plan: ${gemini['recommended_action']}', style: const TextStyle(fontStyle: FontStyle.italic)),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Actions Section
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showPriorityOverrideDialog(complaint),
                        icon: const Icon(Icons.tune),
                        label: const Text('Override Priority'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _openAdminConnect(complaint.department),
                        icon: const Icon(Icons.contact_phone),
                        label: const Text('Admin Connect'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    ),
  );
}
}

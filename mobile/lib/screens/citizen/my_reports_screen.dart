import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/complaint_model.dart';
import '../../services/api_client.dart';
import '../../widgets/severity_badge.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({Key? key}) : super(key: key);

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  final ApiClient _apiClient = ApiClient();
  late Future<List<ComplaintModel>> _complaintsFuture;

  @override
  void initState() {
    super.initState();
    _complaintsFuture = _apiClient.fetchMyComplaints();
  }

  Future<void> _refresh() async {
    setState(() {
      _complaintsFuture = _apiClient.fetchMyComplaints();
    });
  }

  void _showConfirmationDialog(ComplaintModel complaint) {
    final feedbackController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Resolution'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('The maintenance team has marked this issue as resolved. Has it been fixed to your satisfaction?'),
            const SizedBox(height: 12),
            TextField(
              controller: feedbackController,
              decoration: const InputDecoration(
                labelText: 'Feedback / Remarks (Optional)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await _apiClient.confirmResolution(
                  complaintId: complaint.id,
                  isConfirmed: false,
                  feedback: feedbackController.text.trim(),
                );
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Issue marked as not fixed. Ticket reopened!')),
                );
                _refresh();
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to update status: $e'), backgroundColor: Colors.red),
                );
              }
            },
            child: const Text('NO, REOPEN', style: TextStyle(color: Colors.red)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await _apiClient.confirmResolution(
                  complaintId: complaint.id,
                  isConfirmed: true,
                  feedback: feedbackController.text.trim(),
                );
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Thank you! Resolution confirmed and ticket closed.')),
                );
                _refresh();
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to update status: $e'), backgroundColor: Colors.red),
                );
              }
            },
            child: const Text('YES, CONFIRM FIX'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Submissions & Status Trail'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<ComplaintModel>>(
          future: _complaintsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 12),
                    Text('Error loading reports: ${snapshot.error}'),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _refresh, child: const Text('Retry')),
                  ],
                ),
              );
            }

            final list = snapshot.data ?? [];
            if (list.isEmpty) {
              return const Center(
                child: Text('No complaints submitted yet.', style: TextStyle(color: AppTheme.textMuted)),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final complaint = list[index];
                return Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (complaint.imageUrl != null && complaint.imageUrl!.isNotEmpty)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  complaint.imageUrl!,
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                ),
                              )
                            else
                              Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.build, color: AppTheme.primaryBlue),
                              ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    complaint.rawText,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Zone: ${complaint.campusZone.isNotEmpty ? complaint.campusZone : "General Campus"}',
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 20),
                        Row(
                          children: [
                            SeverityBadge(severity: complaint.computedPriority.round()),
                            const SizedBox(width: 8),
                            if (complaint.crowdReportCount > 1)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.purple.shade50,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: Colors.purple.shade200),
                                ),
                                child: Text(
                                  '👥 ${complaint.crowdReportCount} reports',
                                  style: TextStyle(fontSize: 11, color: Colors.purple.shade700, fontWeight: FontWeight.bold),
                                ),
                              ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _getStatusColor(complaint.status).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                complaint.status,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: _getStatusColor(complaint.status),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (complaint.status == 'RESOLVED') ...[
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => _showConfirmationDialog(complaint),
                              icon: const Icon(Icons.rate_review, size: 16),
                              label: const Text('Confirm Fix or Reopen Ticket'),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'CLOSED':
        return Colors.green;
      case 'RESOLVED':
        return AppTheme.secondaryTeal;
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return AppTheme.primaryBlue;
      case 'REOPENED':
        return Colors.orange;
      case 'REJECTED':
        return Colors.red;
      default:
        return Colors.blueGrey;
    }
  }
}

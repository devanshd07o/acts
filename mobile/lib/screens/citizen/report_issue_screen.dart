import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../config/app_routes.dart';
import '../../services/api_client.dart';
import '../../services/camera_service.dart';
import '../../services/location_service.dart';
import '../../widgets/image_preview_card.dart';

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({Key? key}) : super(key: key);

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final CameraService _cameraService = CameraService();
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _zoneController = TextEditingController();

  XFile? _selectedImage;
  double _latitude = 28.6692;
  double _longitude = 77.4538;
  bool _isLoading = false;
  bool _isFetchingLocation = false;

  @override
  void initState() {
    super.initState();
    _fetchGPS();
  }

  @override
  void dispose() {
    _textController.dispose();
    _zoneController.dispose();
    super.dispose();
  }

  Future<void> _fetchGPS() async {
    setState(() => _isFetchingLocation = true);
    try {
      final pos = await LocationService.getCurrentLocation();
      if (pos != null) {
        setState(() {
          _latitude = pos.latitude;
          _longitude = pos.longitude;
        });
      }
    } catch (_) {
      // Fallback coordinates preserved
    } finally {
      setState(() => _isFetchingLocation = false);
    }
  }

  Future<void> _pickImage(bool fromCamera) async {
    final file = fromCamera
        ? await _cameraService.captureImage()
        : await _cameraService.pickFromGallery();
    if (file != null) {
      setState(() => _selectedImage = file);
    }
  }

  Future<void> _submitReport() async {
    final text = _textController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please describe what is broken in your own words.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await _apiClient.submitComplaint(
        rawText: text,
        latitude: _latitude,
        longitude: _longitude,
        imageFile: _selectedImage,
        campusZone: _zoneController.text.trim(),
      );

      final crowdCount = result['crowd_report_count'] ?? 1;
      final priority = result['computed_priority'] ?? 5.0;

      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: AppTheme.secondaryTeal),
              SizedBox(width: 8),
              Text('Report Triage Complete!'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('AI estimated priority: $priority/10', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                crowdCount > 1
                    ? '⚡ Merged with $crowdCount existing reports in this zone. Priority automatically raised!'
                    : 'Report logged & routed to the maintenance team.',
                style: const TextStyle(color: AppTheme.textDark),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                setState(() {
                  _selectedImage = null;
                  _textController.clear();
                  _zoneController.clear();
                });
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submission failed: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ACTS - Report Issue', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_edu),
            tooltip: 'My Reports',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.myReports),
          ),
          IconButton(
            icon: const Icon(Icons.map_rounded),
            tooltip: 'Command Map',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.adminMap),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Section 5.7: Plain text problem description
            const Text(
              'What needs fixing?',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
            ),
            const SizedBox(height: 6),
            const Text(
              'Describe the problem in plain words. AI will detect the department, severity, and urgency automatically.',
              style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _textController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'e.g. Water leaking near hostel Block B entrance, pooling on walkway...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),

            const SizedBox(height: 16),

            // Optional Photo Capture
            const Text(
              'Attach Photo (Optional)',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            if (_selectedImage != null)
              ImagePreviewCard(
                imageFile: _selectedImage,
                onRemove: () => setState(() => _selectedImage = null),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(true),
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Take Photo'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(false),
                      icon: const Icon(Icons.photo_library),
                      label: const Text('Gallery'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),

            const SizedBox(height: 16),

            // Location & Zone Tagging
            TextField(
              controller: _zoneController,
              decoration: InputDecoration(
                labelText: 'Building / Zone (Optional)',
                hintText: 'e.g. Hostel Block B, Central Library, Cafeteria',
                prefixIcon: const Icon(Icons.apartment),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),

            const SizedBox(height: 12),

            // Auto-filled GPS badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on, color: AppTheme.secondaryTeal, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _isFetchingLocation
                          ? 'Acquiring GPS location...'
                          : 'Auto GPS: ${_latitude.toStringAsFixed(4)}, ${_longitude.toStringAsFixed(4)}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textDark),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, size: 18),
                    onPressed: _fetchGPS,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Submit Button
            ElevatedButton(
              onPressed: _isLoading ? null : _submitReport,
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('SUBMIT REPORT', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

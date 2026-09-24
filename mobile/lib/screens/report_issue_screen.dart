import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({super.key});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  XFile? _image;
  Position? _currentPosition;
  bool _isLoading = false;
  final TextEditingController _descriptionController = TextEditingController();

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _takePicture() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera);

    if (pickedFile != null) {
      setState(() {
        _image = pickedFile;
      });
    }
  }

  Future<void> _pickFromGallery() async {
    final pickedFile = await ImagePicker().pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _image = pickedFile;
      });
    }
  }

  Future<void> _getLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Location services are not enabled; show a snackbar or handle accordingly
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location services are disabled.')),
      );
      return;
    }

    // Check and request permission
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permissions are denied.')),
        );
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location permissions are permanently denied.')),
      );
      return;
    }

    // Get current position
    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    setState(() {
      _currentPosition = position;
    });
  }

  Future<void> _submitReport() async {
    // Validate that image and location are present
    if (_image == null || _currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please capture a photo and get GPS coordinates first.'),
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('http://127.0.0.1:8000/api/complaints/report/'),
      );

      // Add string fields
      request.fields['latitude'] = _currentPosition!.latitude.toStringAsFixed(6);
      request.fields['longitude'] = _currentPosition!.longitude.toStringAsFixed(6);
      request.fields['citizen_description'] = _descriptionController.text;
      request.fields['raw_text'] = _descriptionController.text;

      // Attach the image with a valid extension
      if (_image != null) {
        String filename = _image!.name;
        if (!filename.contains('.')) {
          filename = '$filename.jpg';
        }
        request.files.add(
          http.MultipartFile.fromBytes('image', await _image!.readAsBytes(), filename: filename),
        );
      }

      // Send the request
      final response = await request.send();

      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Report submitted successfully!')),
        );
        // Optionally clear the form
        setState(() {
          _image = null;
          _currentPosition = null;
          _descriptionController.clear();
        });
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit report. Status code: ${response.statusCode}'),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Issue'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Image display area
            _image != null
                ? Image.network(
                    _image!.path,
                    height: 200,
                    width: 200,
                    fit: BoxFit.cover,
                  )
                : const Icon(
                    Icons.camera_alt,
                    size: 100,
                    color: Colors.grey,
                  ),
            const SizedBox(height: 20),
            // Capture buttons (Camera & Gallery)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: _takePicture,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Camera'),
                ),
                const SizedBox(width: 16),
                ElevatedButton.icon(
                  onPressed: _pickFromGallery,
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Gallery'),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Location display
            _currentPosition != null
                ? Text(
                    'Lat: ${_currentPosition!.latitude}, Lng: ${_currentPosition!.longitude}',
                  )
                : const Text('Location not captured'),
            const SizedBox(height: 20),
            // GPS button
            ElevatedButton(
              onPressed: _getLocation,
              child: const Text('Get GPS Coordinates'),
            ),
            const SizedBox(height: 24),
            // Description text field
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: TextField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Describe the issue',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ),
            const SizedBox(height: 24),
            // Submit button
            ElevatedButton(
              onPressed: _isLoading ? null : _submitReport,
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit Report'),
            ),
          ],
        ),
      ),
    );
  }
}
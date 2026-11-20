import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import '../../config/app_routes.dart';
import '../../config/theme.dart';
import '../../services/api_client.dart';
import '../../services/auth_service.dart';
import '../../services/camera_service.dart';
import '../../widgets/desktop_scaffold.dart';

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({super.key});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final CameraService _cameraService = CameraService();
  final ApiClient _apiClient = ApiClient();
  final AuthService _auth = AuthService();

  final TextEditingController _notesController = TextEditingController();

  // Guided Flow Step (0: Defect & Photo, 1: Location & Map, 2: Review & Dispatch)
  int _currentStep = 0;

  // Selected Defect Template
  int _selectedDefectIndex = 0;
  XFile? _customPhoto;

  // Location State (ABESEC Campus)
  int _selectedZoneIndex = 0;
  double _latitude = 28.6345;
  double _longitude = 77.4479;

  bool _isLoading = false;

  // 4 Core Real-World Defect Types
  final List<Map<String, dynamic>> _defectTypes = [
    {
      "id": "POTHOLE",
      "title": "Road Pothole & Cracks",
      "category": "CIVIL",
      "severity": 4.0,
      "icon": Icons.broken_image_rounded,
      "color": AppTheme.abesGold,
      "aiLabel": "Civil Infrastructure Triage",
      "crew": "Civil Infrastructure Team",
      "description": "Road surface defect, asphalt pothole, or broken paver block.",
    },
    {
      "id": "ELECTRICAL",
      "title": "Exposed Wire or Spark",
      "category": "ELECTRICAL",
      "severity": 5.0,
      "icon": Icons.bolt_rounded,
      "color": AppTheme.signalVermilion,
      "aiLabel": "Electrical Hazard Triage",
      "crew": "Emergency Electrical Squad",
      "description": "Exposed conduit, sparking fixture, or non-functional campus lighting.",
    },
    {
      "id": "PLUMBING",
      "title": "Pipe Leak or Water Burst",
      "category": "PLUMBING",
      "severity": 4.0,
      "icon": Icons.water_drop_rounded,
      "color": AppTheme.signalCobalt,
      "aiLabel": "Sanitary & Plumbing Triage",
      "crew": "Sanitary & Plumbing Crew",
      "description": "Pressurized pipe rupture, faucet leak, or corridor drainage issue.",
    },
    {
      "id": "SANITATION",
      "title": "Garbage & Waste Overflow",
      "category": "SANITATION",
      "severity": 2.5,
      "icon": Icons.delete_outline_rounded,
      "color": AppTheme.signalEmerald,
      "aiLabel": "Campus Sanitation Triage",
      "crew": "Campus Sanitation Division",
      "description": "Overflowing waste bins or unattended debris in common pathways.",
    },
  ];

  // ABESEC Campus Locations
  final List<Map<String, dynamic>> _campusBuildings = [
    {
      "name": "Central Mess & Walkway",
      "lat": 28.6345,
      "lng": 77.4479,
      "icon": Icons.restaurant_rounded,
    },
    {
      "name": "Aryabhatta Academic Block",
      "lat": 28.6335,
      "lng": 77.4465,
      "icon": Icons.school_rounded,
    },
    {
      "name": "Bhabha Hostel (Boys)",
      "lat": 28.6352,
      "lng": 77.4482,
      "icon": Icons.hotel_rounded,
    },
    {
      "name": "Kalpana Chawla (Girls)",
      "lat": 28.6358,
      "lng": 77.4471,
      "icon": Icons.apartment_rounded,
    },
    {
      "name": "Ramanujan CS Labs",
      "lat": 28.6338,
      "lng": 77.4488,
      "icon": Icons.computer_rounded,
    },
    {
      "name": "Admin & Sports Ground",
      "lat": 28.6328,
      "lng": 77.4472,
      "icon": Icons.sports_basketball_rounded,
    },
  ];

  @override
  void initState() {
    super.initState();
    _selectBuilding(0);
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _selectBuilding(int index) {
    setState(() {
      _selectedZoneIndex = index;
      _latitude = _campusBuildings[index]['lat'] as double;
      _longitude = _campusBuildings[index]['lng'] as double;
    });
  }

  Future<void> _pickCustomPhoto() async {
    final file = await _cameraService.pickFromGallery();
    if (file != null) {
      setState(() => _customPhoto = file);
    }
  }

  Future<void> _submitReport() async {
    final defect = _defectTypes[_selectedDefectIndex];
    final building = _campusBuildings[_selectedZoneIndex];
    final description = _notesController.text.trim().isNotEmpty
        ? _notesController.text.trim()
        : defect['description'] as String;

    setState(() => _isLoading = true);

    try {
      final res = await _apiClient.submitComplaint(
        rawText: description,
        latitude: _latitude,
        longitude: _longitude,
        imageFile: _customPhoto,
        campusZone: building['name'] as String,
        address: 'ABESEC Campus, Ghaziabad',
        userIdentifier: _auth.username,
      );

      final realTicketId = res['complaint']?['id']?.toString() ??
          res['cluster_id']?.toString() ??
          "ACTS-CAMPUS";
      final assignedCrew = res['complaint_detail']?['crew_details']?['name']?.toString() ??
          defect['crew'] as String;

      if (mounted) {
        _showSuccessDialog(realTicketId, assignedCrew);
      }
    } catch (e) {
      if (mounted) {
        final errorMsg = e is ApiException ? e.message : "Failed to connect to backend: $e";
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.signalVermilion,
            content: Text(
              errorMsg,
              style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showSuccessDialog(String ticketId, String crew) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppTheme.signalEmerald.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: AppTheme.signalEmerald, size: 36),
              ),
              const SizedBox(height: 16),
              Text(
                "Report Submitted!",
                style: GoogleFonts.plusJakartaSans(fontSize: 20, fontWeight: FontWeight.w800, height: 1.2),
              ),
              const SizedBox(height: 8),
              Text(
                "Ticket ID: $ticketId\nAssigned to: $crew",
                textAlign: TextAlign.center,
                style: AppTheme.tabular(
                  GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    color: AppTheme.lightTextMuted,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pushReplacementNamed(context, AppRoutes.home);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.abesNavyLight,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text("Return to Radar"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 900;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final content = SingleChildScrollView(
      padding: EdgeInsets.symmetric(
        horizontal: isDesktop ? 48 : 16,
        vertical: 24,
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 860),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Clean Header
              Text(
                "Report Campus Infrastructure Defect",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: isDesktop ? 26 : 21,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  height: 1.2,
                  color: isDark ? AppTheme.darkText : AppTheme.lightText,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                "Guided 3-step reporting workflow with neural defect classification, campus GIS tagging, and automated maintenance dispatch.",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13.5,
                  height: 1.4,
                  color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
                ),
              ),

              const SizedBox(height: 24),

              // 3-Step Progress Bar
              _buildStepper(isDark),

              const SizedBox(height: 28),

              // Dynamic Step View
              if (_currentStep == 0) _buildStep1DefectType(isDark),
              if (_currentStep == 1) _buildStep2Location(isDark),
              if (_currentStep == 2) _buildStep3Review(isDark),
            ],
          ),
        ),
      ),
    );

    return isDesktop
        ? DesktopScaffold(
            title: "Report Issue",
            currentRoute: AppRoutes.reportIssue,
            body: content,
          )
        : Scaffold(
            appBar: AppBar(
              title: const Text("Report Issue", style: TextStyle(fontWeight: FontWeight.w800)),
              actions: [
                IconButton(
                  icon: const Icon(Icons.history_rounded),
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.myReports),
                ),
              ],
            ),
            body: content,
          );
  }

  // --- 3-STEP PROGRESS STEPPER ---
  Widget _buildStepper(bool isDark) {
    final steps = [
      {"num": "1", "title": "Defect Type"},
      {"num": "2", "title": "Location & GIS"},
      {"num": "3", "title": "Review & Dispatch"},
    ];

    return Row(
      children: List.generate(steps.length, (idx) {
        final isCompleted = _currentStep > idx;
        final isCurrent = _currentStep == idx;

        return Expanded(
          child: InkWell(
            onTap: () => setState(() => _currentStep = idx),
            borderRadius: BorderRadius.circular(12),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppTheme.primaryBlue
                        : (isCompleted
                            ? AppTheme.signalEmerald
                            : (isDark ? AppTheme.darkSurfaceElevated : AppTheme.lightSurfaceElevated)),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isCurrent
                          ? AppTheme.primaryBlue
                          : (isCompleted
                              ? AppTheme.signalEmerald
                              : (isDark ? AppTheme.darkBorder : AppTheme.lightBorder)),
                      width: 1.0,
                    ),
                  ),
                  child: Center(
                    child: isCompleted
                        ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
                        : Text(
                            steps[idx]["num"]!,
                            style: AppTheme.tabular(
                              GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: isCurrent ? Colors.white : (isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                              ),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    steps[idx]["title"]!,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12.5,
                      fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                      height: 1.2,
                      color: isCurrent
                          ? (isDark ? AppTheme.darkText : AppTheme.lightText)
                          : (isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (idx < steps.length - 1)
                  Container(
                    width: 24,
                    height: 1.5,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                  ),
              ],
            ),
          ),
        );
      }),
    );
  }

  // --- STEP 1: DEFECT TYPE & PHOTO ---
  Widget _buildStep1DefectType(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          "Select Defect Classification",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isDark ? AppTheme.darkText : AppTheme.lightText,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          "Neural vision models automatically route by defect signature and dispatch specialized crews.",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
            height: 1.3,
          ),
        ),
        const SizedBox(height: 16),

        // 4 Defect Choice Cards
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.1,
          ),
          itemCount: _defectTypes.length,
          itemBuilder: (context, i) {
            final defect = _defectTypes[i];
            final isSelected = _selectedDefectIndex == i;
            final color = defect['color'] as Color;

            return InkWell(
              onTap: () => setState(() => _selectedDefectIndex = i),
              borderRadius: BorderRadius.circular(16),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isSelected
                      ? (isDark ? AppTheme.darkSurfaceElevated : const Color(0xFFF1F5F9))
                      : (isDark ? AppTheme.darkSurface : AppTheme.lightSurface),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected
                        ? AppTheme.primaryBlue
                        : (isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
                    width: isSelected ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: isDark ? 0.16 : 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: color.withValues(alpha: 0.3),
                          width: 1.0,
                        ),
                      ),
                      child: Icon(defect['icon'] as IconData, color: color, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            defect['title'] as String,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              height: 1.2,
                              color: isDark ? AppTheme.darkText : AppTheme.lightText,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  defect['category'] as String,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: color,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                "Sev ${defect['severity']}",
                                style: AppTheme.tabular(
                                  GoogleFonts.plusJakartaSans(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),

        const SizedBox(height: 20),

        // Photo Attachment Section
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
              width: 1.0,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.25), width: 1.0),
                ),
                child: const Icon(Icons.camera_alt_outlined, color: AppTheme.primaryBlue, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _customPhoto != null ? "Attached: ${_customPhoto!.name}" : "Defect Photograph & Vision Input",
                      style: GoogleFonts.plusJakartaSans(fontSize: 13.5, fontWeight: FontWeight.w700, height: 1.2),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _customPhoto != null
                          ? "OpenCV Clarity Checked: 98.4% (Sharp focus)"
                          : "Upload photo or capture using connected sensor/camera",
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11.5,
                        color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
              OutlinedButton.icon(
                onPressed: _pickCustomPhoto,
                icon: const Icon(Icons.upload_rounded, size: 16),
                label: Text(_customPhoto != null ? "Change" : "Add Photo"),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(44, 44),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Additional Description Input
        TextField(
          controller: _notesController,
          maxLines: 2,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13.5,
            color: isDark ? AppTheme.darkText : AppTheme.lightText,
          ),
          decoration: InputDecoration(
            hintText: "Optional contextual notes (e.g., Near room 204 or behind seminar hall corridor)...",
            hintStyle: GoogleFonts.plusJakartaSans(
              fontSize: 12.5,
              color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
            ),
            filled: true,
            fillColor: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
          ),
        ),

        const SizedBox(height: 24),

        // Next Button
        ElevatedButton(
          onPressed: () => setState(() => _currentStep = 1),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            foregroundColor: Colors.white,
            minimumSize: const Size(44, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Next: Select Campus Location",
                style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward_rounded, size: 18),
            ],
          ),
        ),
      ],
    );
  }

  // --- STEP 2: CAMPUS LOCATION & MAP ---
  Widget _buildStep2Location(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          "Campus Location & GIS Coordinate",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isDark ? AppTheme.darkText : AppTheme.lightText,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          "Select the nearest ABESEC building anchor to calibrate the spatial incident cluster.",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
            height: 1.3,
          ),
        ),
        const SizedBox(height: 16),

        // Campus Building Choice Chips
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(_campusBuildings.length, (idx) {
            final building = _campusBuildings[idx];
            final isSelected = _selectedZoneIndex == idx;

            return ChoiceChip(
              avatar: Icon(
                building['icon'] as IconData,
                size: 16,
                color: isSelected ? Colors.white : (isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary),
              ),
              label: Text(building['name'] as String),
              selected: isSelected,
              selectedColor: AppTheme.primaryBlue,
              backgroundColor: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
              labelStyle: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : (isDark ? AppTheme.darkText : AppTheme.lightTextSecondary),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: isSelected
                      ? AppTheme.primaryBlue
                      : (isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
                  width: 1.0,
                ),
              ),
              onSelected: (_) => _selectBuilding(idx),
            );
          }),
        ),

        const SizedBox(height: 20),

        // Embedded Campus Map
        Container(
          height: 280,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
              width: 1.0,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                FlutterMap(
                  options: MapOptions(
                    initialCenter: LatLng(_latitude, _longitude),
                    initialZoom: 17.5,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: isDark
                          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                      subdomains: const ['a', 'b', 'c', 'd'],
                    ),
                    CircleLayer(
                      circles: [
                        CircleMarker(
                          point: LatLng(_latitude, _longitude),
                          radius: 50,
                          useRadiusInMeter: false,
                          color: AppTheme.primaryBlue.withValues(alpha: 0.18),
                          borderColor: AppTheme.primaryBlue,
                          borderStrokeWidth: 1.5,
                        ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: LatLng(_latitude, _longitude),
                          width: 44,
                          height: 44,
                          child: const Icon(Icons.location_on_rounded, color: AppTheme.signalVermilion, size: 38),
                        ),
                      ],
                    ),
                  ],
                ),
                Positioned(
                  bottom: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: (isDark ? AppTheme.darkSurface : Colors.black).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isDark ? AppTheme.darkBorder : Colors.white24,
                        width: 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.near_me_rounded, size: 14, color: AppTheme.signalEmerald),
                        const SizedBox(width: 6),
                        Text(
                          "${_campusBuildings[_selectedZoneIndex]['name']}",
                          style: GoogleFonts.plusJakartaSans(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          "•  ${_latitude.toStringAsFixed(4)}° N, ${_longitude.toStringAsFixed(4)}° E",
                          style: AppTheme.tabular(
                            GoogleFonts.plusJakartaSans(fontSize: 10.5, fontWeight: FontWeight.w500, color: Colors.white70),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Navigation Row (Back & Next)
        Row(
          children: [
            OutlinedButton(
              onPressed: () => setState(() => _currentStep = 0),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(44, 48),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text("Back"),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => setState(() => _currentStep = 2),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(44, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Next: Review Triage", style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded, size: 18),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // --- STEP 3: REVIEW & SEND ---
  Widget _buildStep3Review(bool isDark) {
    final defect = _defectTypes[_selectedDefectIndex];
    final building = _campusBuildings[_selectedZoneIndex];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          "Review Incident & Automated Dispatch",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isDark ? AppTheme.darkText : AppTheme.lightText,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          "Autonomous classification verified. Please confirm triage parameters prior to ticket broadcast.",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
            height: 1.3,
          ),
        ),
        const SizedBox(height: 16),

        // Summary Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
              width: 1.0,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSummaryRow(
                label: "DEFECT CATEGORY",
                value: defect['title'] as String,
                icon: defect['icon'] as IconData,
                color: defect['color'] as Color,
                isDark: isDark,
              ),
              Divider(height: 24, color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
              _buildSummaryRow(
                label: "CAMPUS LOCATION ANCHOR",
                value: "${building['name']} (${_latitude.toStringAsFixed(4)}°N, ${_longitude.toStringAsFixed(4)}°E)",
                icon: Icons.location_on_outlined,
                color: AppTheme.accentBlue,
                isDark: isDark,
                isTabular: true,
              ),
              Divider(height: 24, color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
              _buildSummaryRow(
                label: "CALCULATED SEVERITY INDEX",
                value: "Priority Score ${defect['severity']} / 5.0  •  Immediate Response",
                icon: Icons.speed_rounded,
                color: AppTheme.abesGold,
                isDark: isDark,
                isTabular: true,
              ),
              Divider(height: 24, color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
              _buildSummaryRow(
                label: "ASSIGNED MAINTENANCE SQUAD",
                value: "${defect['crew']}  •  SLA ETA ~12 mins",
                icon: Icons.engineering_outlined,
                color: AppTheme.signalEmerald,
                isDark: isDark,
                isTabular: true,
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Crowd Clustering Info Banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppTheme.abesNavyLight.withValues(alpha: isDark ? 0.25 : 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppTheme.abesNavyLight.withValues(alpha: 0.3),
              width: 1.0,
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.hub_rounded, size: 18, color: AppTheme.abesNavyLight),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "Spatial Deduplication Active: Sub-60m incidents merge automatically into an amplified crowd cluster.",
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppTheme.darkTextSecondary : AppTheme.abesNavy,
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Navigation Row (Back & Final Submit)
        Row(
          children: [
            OutlinedButton(
              onPressed: () => setState(() => _currentStep = 1),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(44, 48),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text("Back"),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitReport,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(44, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.send_rounded, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            "Submit Incident Report",
                            style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryRow({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
    bool isTabular = false,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: isDark ? 0.16 : 0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withValues(alpha: 0.25), width: 1.0),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: isTabular
                    ? AppTheme.tabular(
                        GoogleFonts.plusJakartaSans(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppTheme.darkText : AppTheme.lightText,
                          height: 1.25,
                        ),
                      )
                    : GoogleFonts.plusJakartaSans(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppTheme.darkText : AppTheme.lightText,
                        height: 1.25,
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

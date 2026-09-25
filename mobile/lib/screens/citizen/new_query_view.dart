import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/complaint_model.dart';
import '../../services/ai_triage_service.dart';
import '../../services/api_client.dart';
import '../../widgets/abes_campus_2d_map.dart';

class NewQueryView extends StatefulWidget {
  final VoidCallback onCancel;
  final VoidCallback onReportSubmitted;

  const NewQueryView({
    super.key,
    required this.onCancel,
    required this.onReportSubmitted,
  });

  @override
  State<NewQueryView> createState() => _NewQueryViewState();
}

class _NewQueryViewState extends State<NewQueryView> {
  final ApiClient _apiClient = ApiClient();
  final AiTriageService _aiService = AiTriageService();

  final TextEditingController _notesController = TextEditingController();
  Timer? _debounceTimer;

  XFile? _selectedImage;
  Uint8List? _imageBytes;

  String _buildingName = 'Bhabha Academic Block';
  String _floor = 'Ground Floor';
  double _latitude = 28.6331;
  double _longitude = 77.4468;

  AiTriageAnalysis? _aiAnalysis;
  bool _isAnalyzing = false;
  bool _isSubmitting = false;
  bool _isVoiceRecording = false;

  // Stored answers for the 3-4 gap-filling questions
  final Map<String, String> _questionAnswers = {};

  // User-End Duplicate Warning State
  List<ComplaintModel> _activeBlockComplaints = [];
  ComplaintModel? _matchedDuplicateComplaint;
  bool _dismissDuplicateWarning = false;
  bool _isUpvoting = false;

  @override
  void initState() {
    super.initState();
    _checkDuplicateComplaints();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _checkDuplicateComplaints() async {
    try {
      final all = await _apiClient.fetchAllComplaints();
      final normBuilding = _buildingName.toLowerCase().trim();
      final currentNotes = _notesController.text.toLowerCase().trim();

      final matches = all.where((c) {
        if (c.status == 'RESOLVED' || c.status == 'CLOSED' || c.status == 'REJECTED') {
          return false;
        }
        final cZone = c.campusZone.toLowerCase();
        final cAddr = c.address.toLowerCase();
        final zoneMatch = cZone.contains(normBuilding) ||
            normBuilding.contains(cZone) ||
            cAddr.contains(normBuilding) ||
            (normBuilding.contains('bhabha') && cZone.contains('bhabha')) ||
            (normBuilding.contains('aryabhatta') && cZone.contains('aryabhatta')) ||
            (normBuilding.contains('raman') && cZone.contains('raman')) ||
            (normBuilding.contains('kalpana') && cZone.contains('kalpana')) ||
            (normBuilding.contains('hostel') && (cZone.contains('hostel') || cAddr.contains('hostel'))) ||
            (normBuilding.contains('mess') && (cZone.contains('mess') || cAddr.contains('mess'))) ||
            (normBuilding.contains('cafeteria') && (cZone.contains('cafeteria') || cAddr.contains('cafeteria')));

        if (!zoneMatch) return false;

        if (currentNotes.isNotEmpty) {
          final words = currentNotes.split(RegExp(r'\s+')).where((w) => w.length > 3);
          final textMatch = words.any((w) => c.rawText.toLowerCase().contains(w));
          return textMatch || c.department.toLowerCase().contains(currentNotes);
        }
        return true;
      }).toList();

      if (mounted) {
        setState(() {
          _activeBlockComplaints = matches;
          _matchedDuplicateComplaint = matches.isNotEmpty ? matches.first : null;
          _dismissDuplicateWarning = false;
        });
      }
    } catch (e) {
      debugPrint("Error checking duplicate complaints: $e");
    }
  }

  Future<void> _upvoteMatchedComplaint() async {
    if (_matchedDuplicateComplaint == null) return;
    setState(() => _isUpvoting = true);
    try {
      await _apiClient.upvoteComplaint(_matchedDuplicateComplaint!.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF10B981),
          content: Row(
            children: [
              const Icon(Icons.thumb_up_alt_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "Upvoted existing incident! Crowd urgency boosted.",
                  style: GoogleFonts.comfortaa(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
      );
      widget.onReportSubmitted();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFDC2626),
          content: Text("Failed to upvote: $e", style: GoogleFonts.comfortaa()),
        ),
      );
    } finally {
      if (mounted) setState(() => _isUpvoting = false);
    }
  }

  void _onNotesChanged(String text) {
    _debounceTimer?.cancel();
    if (text.trim().isEmpty && _imageBytes == null) {
      setState(() {
        _aiAnalysis = null;
        _isAnalyzing = false;
        _questionAnswers.clear();
      });
      _checkDuplicateComplaints();
      return;
    }
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _triggerAiAnalysis();
      _checkDuplicateComplaints();
    });
  }

  void _toggleVoiceDictation() {
    setState(() {
      _isVoiceRecording = !_isVoiceRecording;
    });
  }

  void _applyVoicePreset(String text) {
    _notesController.text = text;
    _notesController.selection = TextSelection.fromPosition(TextPosition(offset: text.length));
    setState(() => _isVoiceRecording = false);
    _triggerAiAnalysis();
    _checkDuplicateComplaints();
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        setState(() {
          _selectedImage = picked;
          _imageBytes = bytes;
        });
        _triggerAiAnalysis();
      }
    } catch (e) {
      debugPrint("Error picking image: $e");
    }
  }

  void _removeImage() {
    setState(() {
      _selectedImage = null;
      _imageBytes = null;
    });
    if (_notesController.text.trim().isEmpty) {
      setState(() {
        _aiAnalysis = null;
        _isAnalyzing = false;
        _questionAnswers.clear();
      });
    } else {
      _triggerAiAnalysis();
    }
  }

  Future<void> _triggerAiAnalysis() async {
    final notes = _notesController.text.trim();
    if (_imageBytes == null && notes.isEmpty) {
      setState(() {
        _aiAnalysis = null;
        _isAnalyzing = false;
        _questionAnswers.clear();
      });
      return;
    }

    setState(() => _isAnalyzing = true);
    try {
      final analysis = await _aiService.analyzeDefect(
        imageBytes: _imageBytes,
        notes: notes,
        campusZone: "$_buildingName ($_floor)",
      );
      if (!mounted) return;
      setState(() {
        _aiAnalysis = analysis;
      });
    } catch (e) {
      debugPrint("AI analysis error: $e");
    } finally {
      if (mounted) setState(() => _isAnalyzing = false);
    }
  }

  Future<void> _submitReport() async {
    final notes = _notesController.text.trim();
    if (_imageBytes == null && notes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFDC2626),
          content: Text(
            "Please provide a defect photograph or describe the issue in notes.",
            style: GoogleFonts.comfortaa(fontWeight: FontWeight.w600),
          ),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Build comprehensive description including AI gap answers
      final buffer = StringBuffer();
      if (notes.isNotEmpty) {
        buffer.writeln(notes);
      } else {
        buffer.writeln(_aiAnalysis?.defectName ?? "Campus Infrastructure Defect");
      }

      if (_questionAnswers.isNotEmpty) {
        buffer.writeln("\n--- Incident Clarifications ---");
        _questionAnswers.forEach((q, a) {
          buffer.writeln("• $q: $a");
        });
      }

      final fullDescription = buffer.toString().trim();
      final address = "$_buildingName • $_floor";

      await _apiClient.submitComplaint(
        rawText: fullDescription,
        latitude: _latitude,
        longitude: _longitude,
        imageFile: _selectedImage,
        campusZone: _buildingName,
        address: address,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF10B981),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "Issue dispatched successfully! Tracking in My Active Reports.",
                  style: GoogleFonts.comfortaa(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
      );

      widget.onReportSubmitted();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(
              "Submission error: $e",
              style: GoogleFonts.comfortaa(fontWeight: FontWeight.w600),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Color _getCategoryColor(String cat) {
    switch (cat.toUpperCase()) {
      case 'ELECTRICAL':
        return const Color(0xFFDC2626);
      case 'PLUMBING':
        return const Color(0xFF0284C7);
      case 'SANITATION':
        return const Color(0xFF0D9488);
      case 'CIVIL':
      default:
        return const Color(0xFFF97316);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0);
    final cardBg = isDark ? const Color(0xFF141A26) : Colors.white;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Breadcrumb & Title Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      InkWell(
                        onTap: widget.onCancel,
                        borderRadius: BorderRadius.circular(6),
                        child: Text(
                          "Home",
                          style: GoogleFonts.comfortaa(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFFF97316),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "/",
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white38 : Colors.black38,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "New Infrastructure Query",
                        style: GoogleFonts.comfortaa(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Submit Campus Infrastructure Query",
                    style: GoogleFonts.comfortaa(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              OutlinedButton.icon(
                onPressed: widget.onCancel,
                icon: const Icon(Icons.arrow_back_rounded, size: 16),
                label: Text(
                  "Back to Overview",
                  style: GoogleFonts.comfortaa(fontSize: 11.5, fontWeight: FontWeight.w700),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // ===================================================================
          // ⚠️ USER-END DUPLICATE DEFECT WARNING & 1-TAP UPVOTE CARD
          // ===================================================================
          if (_matchedDuplicateComplaint != null && !_dismissDuplicateWarning) ...[
            _buildDuplicateWarningCard(isDark, borderColor),
            const SizedBox(height: 20),
          ],

          // ===================================================================
          // 📸 1. DEFECT PHOTOGRAPH (MAIN FOCUS)
          // ===================================================================
          _buildPhotographSection(isDark, cardBg, borderColor),

          const SizedBox(height: 20),

          // ===================================================================
          // 📝 2. OPTIONAL CONTEXT NOTES (SECONDARY FOCUS)
          // ===================================================================
          _buildNotesSection(isDark, cardBg, borderColor),

          const SizedBox(height: 20),

          // ===================================================================
          // 🧠 3. AUTONOMOUS AI DIAGNOSIS & GAP FILLING (ONLY WHEN USER HAS EVIDENCE/NOTES)
          // ===================================================================
          if (_imageBytes != null || _notesController.text.trim().isNotEmpty) ...[
            _buildAiAnalysisSection(isDark, cardBg, borderColor),
            const SizedBox(height: 20),
          ],

          // ===================================================================
          // 🗺️ 4. 2D ABES CAMPUS BLUEPRINT LOCATION PICKER
          // ===================================================================
          AbesCampus2DMap(
            initialSelectedLocation: _buildingName,
            onLocationSelected: (building, floor, lat, lng) {
              setState(() {
                _buildingName = building;
                _floor = floor;
                _latitude = lat;
                _longitude = lng;
              });
              _checkDuplicateComplaints();
            },
          ),

          const SizedBox(height: 28),

          // ===================================================================
          // 🚀 5. DISPATCH ACTION BAR
          // ===================================================================
          _buildDispatchBar(isDark),
        ],
      ),
    );
  }

  // --- STEP 1: DEFECT PHOTOGRAPH SECTION ---
  Widget _buildPhotographSection(bool isDark, Color cardBg, Color borderColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF97316).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.camera_alt_rounded, color: Color(0xFFF97316), size: 18),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            "1. Defect Photograph",
                            style: GoogleFonts.comfortaa(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF97316).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "PRIMARY EVIDENCE",
                              style: GoogleFonts.comfortaa(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFFF97316),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        "Upload high-resolution image of the fault for computer vision analysis",
                        style: GoogleFonts.comfortaa(
                          fontSize: 10,
                          color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              if (_imageBytes != null)
                TextButton.icon(
                  onPressed: _removeImage,
                  icon: const Icon(Icons.delete_outline_rounded, size: 16, color: Color(0xFFEF4444)),
                  label: Text(
                    "Remove",
                    style: GoogleFonts.comfortaa(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFEF4444),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          if (_imageBytes == null)
            // Empty Upload Drop Area
            InkWell(
              onTap: _pickImage,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F1522) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFF97316).withValues(alpha: 0.35),
                    width: 1.5,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF97316).withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.add_a_photo_rounded,
                        size: 26,
                        color: Color(0xFFF97316),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "Click to Select or Drop Photograph",
                      style: GoogleFonts.comfortaa(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Supports JPEG, PNG • Instant camera defect analysis",
                      style: GoogleFonts.comfortaa(
                        fontSize: 11,
                        color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            // Image Preview Card
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  alignment: Alignment.bottomLeft,
                  children: [
                    Image.memory(
                      _imageBytes!,
                      height: 240,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.black.withValues(alpha: 0.8)],
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                              const SizedBox(width: 8),
                              Text(
                                "Evidence Photo Attached (${(_imageBytes!.length / 1024).toStringAsFixed(0)} KB)",
                                style: GoogleFonts.comfortaa(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          ElevatedButton.icon(
                            onPressed: _pickImage,
                            icon: const Icon(Icons.refresh_rounded, size: 14),
                            label: Text(
                              "Change Photo",
                              style: GoogleFonts.comfortaa(fontSize: 11, fontWeight: FontWeight.w700),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white24,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // --- STEP 2: OPTIONAL CONTEXT NOTES ---
  Widget _buildNotesSection(bool isDark, Color cardBg, Color borderColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.notes_rounded, color: Color(0xFF2563EB), size: 18),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "2. Context Notes & Details",
                        style: GoogleFonts.comfortaa(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      Text(
                        "Provide any context or symptoms (AI extracts hazard signals to auto-route squad)",
                        style: GoogleFonts.comfortaa(
                          fontSize: 10,
                          color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              // Voice Input / Dictation Action Button
              InkWell(
                onTap: _toggleVoiceDictation,
                borderRadius: BorderRadius.circular(10),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: _isVoiceRecording
                        ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                        : (isDark ? const Color(0xFF1E283C) : const Color(0xFFF1F5F9)),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _isVoiceRecording
                          ? const Color(0xFFEF4444)
                          : (isDark ? const Color(0xFF28364F) : const Color(0xFFCBD5E1)),
                      width: 1.2,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _isVoiceRecording ? Icons.mic_rounded : Icons.mic_none_rounded,
                        size: 16,
                        color: _isVoiceRecording
                            ? const Color(0xFFEF4444)
                            : (isDark ? Colors.white70 : const Color(0xFF475569)),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isVoiceRecording ? "Listening..." : "Voice Input",
                        style: GoogleFonts.comfortaa(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _isVoiceRecording
                              ? const Color(0xFFEF4444)
                              : (isDark ? Colors.white70 : const Color(0xFF475569)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Active Voice Dictation Banner & Quick Voice Transcripts
          if (_isVoiceRecording) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFFEF4444),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "Audio Dictation Active — Speak or tap quick phrase below",
                            style: GoogleFonts.comfortaa(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFFEF4444),
                            ),
                          ),
                        ],
                      ),
                      InkWell(
                        onTap: () => setState(() => _isVoiceRecording = false),
                        child: Text(
                          "Done",
                          style: GoogleFonts.comfortaa(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFFEF4444),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      "💧 Washroom me pipe burst ho gaya hai, poora floor flood ho raha hai",
                      "⚡ 2nd floor staircase par exposed electrical wire se spark nikal raha hai",
                      "🚧 Main gate approach road par gehra pothole hai, urgent repair chahiye",
                      "🕳️ Admin block ke peeche open sewer manhole bina cover ke dangerous hai",
                      "🗑️ Hostel mess ke paas garbage bin overflow ho gaya hai, foul smell aa rahi hai",
                      "💡 Library block ke samne street light kharab hai, andhera rehta hai",
                    ].map((phrase) {
                      return InkWell(
                        onTap: () => _applyVoicePreset(phrase),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF141A26) : Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isDark ? const Color(0xFF28364F) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Text(
                            phrase,
                            style: GoogleFonts.comfortaa(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white70 : const Color(0xFF334155),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],

          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F1522) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            child: TextField(
              controller: _notesController,
              onChanged: _onNotesChanged,
              maxLines: 3,
              style: GoogleFonts.comfortaa(
                fontSize: 12.5,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
              decoration: InputDecoration(
                hintText:
                    "e.g., Water is leaking from the ceiling onto the 2nd-floor lab corridor, or exposed sparking cable near entrance...",
                hintStyle: GoogleFonts.comfortaa(
                  fontSize: 11.5,
                  color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                ),
                contentPadding: const EdgeInsets.all(14),
                border: InputBorder.none,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- STEP 3: AUTONOMOUS AI DIAGNOSTIC ANALYSIS & GAP QUESTIONS ---
  Widget _buildAiAnalysisSection(bool isDark, Color cardBg, Color borderColor) {
    final analysis = _aiAnalysis;
    final catColor = _getCategoryColor(analysis?.category ?? "CIVIL");

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: catColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.auto_awesome_rounded, color: catColor, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "3. Autonomous AI Diagnosis & Priority Triage",
                        style: GoogleFonts.comfortaa(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      Text(
                        "Synthesized classification, severity scaling, and hazard gap resolution",
                        style: GoogleFonts.comfortaa(
                          fontSize: 10,
                          color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              if (_isAnalyzing)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2.0),
                ),
            ],
          ),

          const SizedBox(height: 16),

          if (analysis != null) ...[
            // Diagnosis Banner Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: catColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: catColor.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: catColor.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        "S${analysis.severity}",
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: catColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          analysis.defectName,
                          style: GoogleFonts.comfortaa(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Category: ${analysis.category} • Target Dispatch: ${analysis.requiredCrew} (${analysis.estimatedResolutionMinutes}m SLA)",
                          style: GoogleFonts.comfortaa(
                            fontSize: 10.5,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            if (analysis.hazardWarning.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, size: 16, color: Color(0xFFDC2626)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        analysis.hazardWarning,
                        style: GoogleFonts.comfortaa(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFDC2626),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // 3-4 GAP-FILLING QUESTIONS
            Text(
              "QUICK CLARIFICATIONS (FILL CONTEXT GAPS)",
              style: GoogleFonts.comfortaa(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.1,
                color: const Color(0xFFF97316),
              ),
            ),
            const SizedBox(height: 10),

            ...analysis.suggestedQuestions.map((question) {
              final currentAnswer = _questionAnswers[question];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF182030) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? const Color(0xFF263249) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        question,
                        style: GoogleFonts.comfortaa(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF1E293B),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: ['Yes', 'No', 'Unsure'].map((choice) {
                        final isSelected = currentAnswer == choice;
                        return Padding(
                          padding: const EdgeInsets.only(left: 6),
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _questionAnswers[question] = choice;
                              });
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFFF97316)
                                    : (isDark ? const Color(0xFF222B3D) : const Color(0xFFE2E8F0)),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                choice,
                                style: GoogleFonts.comfortaa(
                                  fontSize: 10.5,
                                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                  color: isSelected
                                      ? Colors.white
                                      : (isDark ? Colors.white70 : const Color(0xFF475569)),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  // --- STEP 5: DISPATCH ACTION BAR ---
  Widget _buildDispatchBar(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        OutlinedButton(
          onPressed: _isSubmitting ? null : widget.onCancel,
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: Text(
            "Cancel",
            style: GoogleFonts.comfortaa(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(width: 14),
        ElevatedButton.icon(
          onPressed: _isSubmitting ? null : _submitReport,
          icon: _isSubmitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Icon(Icons.send_rounded, size: 16),
          label: Text(
            _isSubmitting ? "Dispatched..." : "Dispatch Infrastructure Report",
            style: GoogleFonts.comfortaa(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.3,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFF97316),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ],
    );
  }

  // --- USER-END DUPLICATE WARNING CARD ---
  Widget _buildDuplicateWarningCard(bool isDark, Color borderColor) {
    final dup = _matchedDuplicateComplaint!;
    final zoneDisplay = dup.campusZone.isNotEmpty ? dup.campusZone : _buildingName;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1B4B).withValues(alpha: 0.45) : const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFF3B82F6),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.shield_outlined, color: Color(0xFF3B82F6), size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Duplicate Prevention: Active Defect Detected Here",
                      style: GoogleFonts.comfortaa(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF1E3A8A),
                      ),
                    ),
                    Text(
                      "An active defect is already under remediation in $zoneDisplay${_activeBlockComplaints.length > 1 ? ' (${_activeBlockComplaints.length} active issues)' : ''}",
                      style: GoogleFonts.comfortaa(
                        fontSize: 11,
                        color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF2563EB),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 20),
                tooltip: 'Dismiss warning',
                onPressed: () => setState(() => _dismissDuplicateWarning = true),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFDBEAFE)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        dup.department,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF3B82F6)),
                      ),
                    ),
                    Text(
                      '👥 ${dup.crowdReportCount} Merged Student Reports',
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF8B5CF6)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  dup.rawText,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: _isUpvoting ? null : _upvoteMatchedComplaint,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: _isUpvoting
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.thumb_up_alt_rounded, size: 18),
                  label: Text(
                    _isUpvoting ? "Upvoting..." : "Upvote Existing (+1 Urgency Boost)",
                    style: GoogleFonts.comfortaa(fontWeight: FontWeight.w800, fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton(
                onPressed: () => setState(() => _dismissDuplicateWarning = true),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(
                  "Report Different Defect",
                  style: GoogleFonts.comfortaa(fontWeight: FontWeight.w700, fontSize: 11.5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

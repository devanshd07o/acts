import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CampusLocationData {
  final String id;
  final String name;
  final String category; // 'academic', 'hostel', 'sports', 'facility'
  final String departmentTag;
  final Rect relativeBounds; // Normalized 0..1 coordinates on blueprint
  final double latitude;
  final double longitude;
  final IconData icon;
  final int totalFloors;
  final Color? footprintColor;

  const CampusLocationData({
    required this.id,
    required this.name,
    required this.category,
    required this.departmentTag,
    required this.relativeBounds,
    required this.latitude,
    required this.longitude,
    required this.icon,
    this.totalFloors = 4,
    this.footprintColor,
  });
}

class AbesCampus2DMap extends StatefulWidget {
  final String? initialSelectedLocation;
  final void Function(String buildingName, String floor, double latitude, double longitude)
      onLocationSelected;

  const AbesCampus2DMap({
    super.key,
    this.initialSelectedLocation,
    required this.onLocationSelected,
  });

  @override
  State<AbesCampus2DMap> createState() => _AbesCampus2DMapState();
}

class _AbesCampus2DMapState extends State<AbesCampus2DMap> {
  // Verified ABES Engineering College Campus Blueprint Landmarks
  // Real Orientation:
  // South (Bottom) = NH-09 Expressway, Main Gate 1, Cafes, Nescafe Plaza, Temple, Bhabha & Aryabhata Front Wings
  // Center = Kalpana Chawla (6F Tallest), Ramanujan (3F Bridge), ABES Business School & Audi (4F)
  // Mid-North = Massive Floodlit Cricket Stadium
  // Far North / Rear = Half-Olympic Swimming Pool, Vidushi Girls Hostel (West), Dayanand (Solar) & Vivekanand Boys Hostels
  static const List<CampusLocationData> campusBuildings = [
    // -------------------------------------------------------------------------
    // 1. ENTRANCE & FRONT AMENITIES (SOUTH FACING NH-09 HIGHWAY)
    // -------------------------------------------------------------------------
    CampusLocationData(
      id: 'entrance_arch',
      name: 'Main 3-Dome Entrance Gate',
      category: 'facility',
      departmentTag: 'NH-09 Expressway Frontage • Gate 1 Security Checkpost',
      relativeBounds: Rect.fromLTWH(0.38, 0.93, 0.24, 0.05),
      latitude: 28.6350,
      longitude: 77.4580,
      icon: Icons.sensor_door_rounded,
      totalFloors: 1,
    ),
    CampusLocationData(
      id: 'cafes_block',
      name: 'Campus Cafes & Eateries Hub',
      category: 'facility',
      departmentTag: 'Tea Man\'s • Starbean Espresso • Juice Bar • 2 Floors Outdoor Deck',
      relativeBounds: Rect.fromLTWH(0.08, 0.81, 0.28, 0.09),
      latitude: 28.6352,
      longitude: 77.4572,
      icon: Icons.local_cafe_rounded,
      totalFloors: 2,
    ),
    CampusLocationData(
      id: 'nescafe_corner',
      name: 'Nescafe Corner & Circular Plaza',
      category: 'facility',
      departmentTag: 'Round Grilling Seating • Shady Amaltas Tree • Red Coffee Kiosk',
      relativeBounds: Rect.fromLTWH(0.40, 0.81, 0.20, 0.09),
      latitude: 28.6353,
      longitude: 77.4580,
      icon: Icons.coffee_rounded,
      totalFloors: 1,
      footprintColor: Color(0xFFDC2626),
    ),
    CampusLocationData(
      id: 'temple',
      name: 'Campus Temple (Mandir)',
      category: 'facility',
      departmentTag: 'White Marble Sanctum • Golden Brass Spire • Meditation Garden',
      relativeBounds: Rect.fromLTWH(0.64, 0.81, 0.28, 0.09),
      latitude: 28.6352,
      longitude: 77.4588,
      icon: Icons.temple_hindu_rounded,
      totalFloors: 1,
      footprintColor: Color(0xFFD97706),
    ),

    // -------------------------------------------------------------------------
    // 2. FRONT ACADEMIC ROW (3 FLOORS, GROUND ARCHED COLONNADE)
    // -------------------------------------------------------------------------
    CampusLocationData(
      id: 'bhabha',
      name: 'Bhabha Academic Block',
      category: 'academic',
      departmentTag: 'Central Admin • Central Library (250 seats) • Arched Colonnade (3F)',
      relativeBounds: Rect.fromLTWH(0.08, 0.65, 0.34, 0.12),
      latitude: 28.6355,
      longitude: 77.4570,
      icon: Icons.account_balance_rounded,
      totalFloors: 3,
    ),
    CampusLocationData(
      id: 'stair_tower',
      name: 'Circular Staircase Tower & Courtyard',
      category: 'academic',
      departmentTag: 'Glass Stair Tower Connector • Central Paved Sitting Quadrangle',
      relativeBounds: Rect.fromLTWH(0.44, 0.66, 0.12, 0.10),
      latitude: 28.6356,
      longitude: 77.4580,
      icon: Icons.stairs_rounded,
      totalFloors: 3,
    ),
    CampusLocationData(
      id: 'aryabhata',
      name: 'Aryabhata Academic Block',
      category: 'academic',
      departmentTag: 'CSE • IT • AI & ML Labs • Arched Colonnade (3F)',
      relativeBounds: Rect.fromLTWH(0.58, 0.65, 0.34, 0.12),
      latitude: 28.6355,
      longitude: 77.4590,
      icon: Icons.computer_rounded,
      totalFloors: 3,
    ),

    // -------------------------------------------------------------------------
    // 3. CENTRAL ACADEMIC ROW (BEHIND FRONT ROW)
    // -------------------------------------------------------------------------
    CampusLocationData(
      id: 'ramanujan',
      name: 'Ramanujan Block',
      category: 'academic',
      departmentTag: 'ECE & EE Labs • Heavy Workshop • Covered Bridge to Bhabha (3F)',
      relativeBounds: Rect.fromLTWH(0.08, 0.48, 0.30, 0.12),
      latitude: 28.6360,
      longitude: 77.4570,
      icon: Icons.precision_manufacturing_rounded,
      totalFloors: 3,
    ),
    CampusLocationData(
      id: 'kalpana',
      name: 'Kalpana Chawla Block',
      category: 'academic',
      departmentTag: 'TALLEST Building on Campus (6 Floors) • 1st Year Dean • CRC Placement',
      relativeBounds: Rect.fromLTWH(0.41, 0.46, 0.18, 0.15),
      latitude: 28.6361,
      longitude: 77.4580,
      icon: Icons.school_rounded,
      totalFloors: 6,
      footprintColor: Color(0xFF4338CA),
    ),
    CampusLocationData(
      id: 'business_school',
      name: 'ABES Business School & Audi',
      category: 'academic',
      departmentTag: 'Dr. S. Radhakrishnan 500-Seat Audi • MBA & MCA Wing (4F)',
      relativeBounds: Rect.fromLTWH(0.62, 0.48, 0.30, 0.12),
      latitude: 28.6360,
      longitude: 77.4590,
      icon: Icons.speaker_group_rounded,
      totalFloors: 4,
    ),

    // -------------------------------------------------------------------------
    // 4. SPORTS ARENA (AHEAD OF ACADEMIC BLOCKS)
    // -------------------------------------------------------------------------
    CampusLocationData(
      id: 'sports',
      name: 'Floodlit Cricket Stadium',
      category: 'sports',
      departmentTag: 'Massive Championship Turf Ground • Pitch • Pavilion & 4 Floodlights',
      relativeBounds: Rect.fromLTWH(0.18, 0.27, 0.64, 0.15),
      latitude: 28.6368,
      longitude: 77.4580,
      icon: Icons.sports_cricket_rounded,
      totalFloors: 1,
      footprintColor: Color(0xFF16A34A),
    ),

    // -------------------------------------------------------------------------
    // 5. REAR CAMPUS & RESIDENTIAL HOSTEL SECTOR (BEHIND CRICKET GROUND)
    // -------------------------------------------------------------------------
    CampusLocationData(
      id: 'swimming_pool',
      name: 'Half-Olympic Swimming Pool',
      category: 'sports',
      departmentTag: 'Aquatics Complex • 6 Competition Lanes • Positioned Ahead of Hostels',
      relativeBounds: Rect.fromLTWH(0.36, 0.17, 0.28, 0.07),
      latitude: 28.6374,
      longitude: 77.4578,
      icon: Icons.pool_rounded,
      totalFloors: 1,
      footprintColor: Color(0xFF0284C7),
    ),
    CampusLocationData(
      id: 'girls_hostel',
      name: 'Vidushi Bhawan Girls Hostel',
      category: 'hostel',
      departmentTag: 'Gated Girls Residential Complex • West of Pool • 4 Floors',
      relativeBounds: Rect.fromLTWH(0.06, 0.07, 0.26, 0.16),
      latitude: 28.6377,
      longitude: 77.4565,
      icon: Icons.female_rounded,
      totalFloors: 4,
      footprintColor: Color(0xFFDB2777),
    ),
    CampusLocationData(
      id: 'boys_hostel_1',
      name: 'Dayanand Bhawan (DNB)',
      category: 'hostel',
      departmentTag: 'Senior Boys Hostel • Rooftop Solar Array • Mess & Gym (4F)',
      relativeBounds: Rect.fromLTWH(0.38, 0.06, 0.26, 0.10),
      latitude: 28.6380,
      longitude: 77.4580,
      icon: Icons.solar_power_rounded,
      totalFloors: 4,
      footprintColor: Color(0xFFEA580C),
    ),
    CampusLocationData(
      id: 'boys_hostel_2',
      name: 'Vivekanand Bhawan (VKB)',
      category: 'hostel',
      departmentTag: '1st Year Boys Hostel • Dining Hall & Courtyard (4F)',
      relativeBounds: Rect.fromLTWH(0.68, 0.06, 0.26, 0.16),
      latitude: 28.6380,
      longitude: 77.4595,
      icon: Icons.bed_rounded,
      totalFloors: 4,
      footprintColor: Color(0xFF059669),
    ),
  ];

  late CampusLocationData _selectedBuilding;
  late String _selectedFloor;
  Offset? _customPinNormalized;
  String _activeCategoryFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _selectedBuilding = campusBuildings.firstWhere(
      (b) => b.name == widget.initialSelectedLocation,
      orElse: () => campusBuildings[1], // Default: Aryabhata
    );
    _selectedFloor = 'Ground Floor';
    _customPinNormalized = _selectedBuilding.relativeBounds.center;
    _notifyParent();
  }

  List<String> _getAvailableFloors(CampusLocationData building) {
    if (building.totalFloors == 6) {
      return [
        'Ground Floor (Dean 1st Yr & Atrium)',
        '1st Floor (CRC Placement & Interview Suites)',
        '2nd Floor (Applied Maths & LH-301 to 306)',
        '3rd Floor (Applied Sciences & LH-401 to 406)',
        '4th Floor (Innovation & Startup Incubation Hub)',
        '5th / 6th Floor (Executive Conference Hall)',
        'Rooftop / Antenna Weather Station',
      ];
    } else if (building.totalFloors == 4) {
      if (building.id == 'business_school') {
        return [
          'Ground Floor (Dr. Radhakrishnan Audi - 500 seats)',
          '1st Floor (Management HOD & Seminar Hall 2)',
          '2nd Floor (MBA Classrooms M-201 to M-206)',
          '3rd / 4th Floor (MCA Advanced Labs)',
          'Terrace Garden',
        ];
      }
      return [
        'Ground Floor (Lobby & Common Hall)',
        '1st Floor',
        '2nd Floor',
        '3rd Floor',
        'Rooftop Terrace',
      ];
    } else if (building.totalFloors == 3) {
      if (building.id == 'bhabha') {
        return [
          'Ground Floor (Director, Registrar & Accounts)',
          '1st Floor (Central Library Reading Hall - 250 Seats)',
          '2nd Floor (Dean Academics & Exam Cell)',
          'Terrace / Roof',
        ];
      }
      if (building.id == 'aryabhata') {
        return [
          'Ground Floor (CSE Reception & Server Room)',
          '1st Floor (LH-101, Data Structures Lab)',
          '2nd Floor (AI & ML Center, Cyber Range)',
          'Terrace / Roof',
        ];
      }
      if (building.id == 'ramanujan') {
        return [
          'Ground Floor (Heavy Machining Lab & Workshop Bay)',
          '1st Floor (DSP & Analog Electronics Labs)',
          '2nd Floor (Robotics Arena & Power Systems)',
          'Terrace / Roof',
        ];
      }
      return [
        'Ground Floor',
        '1st Floor',
        '2nd Floor',
        'Terrace / Roof',
      ];
    } else if (building.totalFloors == 2) {
      return [
        'Ground Floor (Tea Man\'s, Starbean & Food Deck)',
        '1st Floor (Student Discussion Lounge)',
      ];
    } else {
      return [
        'Ground Floor / Main Area',
        'Surrounding Plaza / Grounds',
      ];
    }
  }

  void _selectBuilding(CampusLocationData building) {
    setState(() {
      _selectedBuilding = building;
      _customPinNormalized = building.relativeBounds.center;
      final floors = _getAvailableFloors(building);
      if (!floors.contains(_selectedFloor)) {
        _selectedFloor = floors.first;
      }
    });
    _notifyParent();
  }

  void _handleTapOnMap(Offset localPos, Size mapSize) {
    if (mapSize.width <= 0 || mapSize.height <= 0) return;
    final normalized = Offset(
      (localPos.dx / mapSize.width).clamp(0.0, 1.0),
      (localPos.dy / mapSize.height).clamp(0.0, 1.0),
    );

    CampusLocationData? matched;
    for (final b in campusBuildings) {
      if (b.relativeBounds.contains(normalized)) {
        matched = b;
        break;
      }
    }

    setState(() {
      _customPinNormalized = normalized;
      if (matched != null) {
        _selectedBuilding = matched;
        final floors = _getAvailableFloors(matched);
        if (!floors.contains(_selectedFloor)) {
          _selectedFloor = floors.first;
        }
      }
    });
    _notifyParent();
  }

  void _notifyParent() {
    final lat = _selectedBuilding.latitude;
    final lng = _selectedBuilding.longitude;
    widget.onLocationSelected(_selectedBuilding.name, _selectedFloor, lat, lng);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0);
    final cardBg = isDark ? const Color(0xFF141A26) : Colors.white;
    final floors = _getAvailableFloors(_selectedBuilding);

    final filteredBuildings = _activeCategoryFilter == 'ALL'
        ? campusBuildings
        : campusBuildings.where((b) => b.category == _activeCategoryFilter).toList();

    return Container(
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
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          // 1. Header Row with Title & Pinpoint GPS
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 10),
            child: Row(
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
                      child: const Icon(
                        Icons.map_rounded,
                        color: Color(0xFF2563EB),
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "ABES Engineering College 2D Campus Blueprint",
                          style: GoogleFonts.comfortaa(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          "Click building directly on map or pick from categorized landmarks below",
                          style: GoogleFonts.comfortaa(
                            fontSize: 10,
                            color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.gps_fixed_rounded, size: 12, color: Color(0xFF10B981)),
                      const SizedBox(width: 5),
                      Text(
                        "${_selectedBuilding.latitude.toStringAsFixed(4)}° N, ${_selectedBuilding.longitude.toStringAsFixed(4)}° E",
                        style: GoogleFonts.comfortaa(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 2. Category Filter Pills (Horizontal Scroll Enabled)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: [
                  _buildCategoryPill('ALL', 'All 15 Landmarks', isDark),
                  const SizedBox(width: 6),
                  _buildCategoryPill('academic', 'Academic (6)', isDark),
                  const SizedBox(width: 6),
                  _buildCategoryPill('hostel', 'Hostels (3)', isDark),
                  const SizedBox(width: 6),
                  _buildCategoryPill('sports', 'Sports & Pool (2)', isDark),
                  const SizedBox(width: 6),
                  _buildCategoryPill('facility', 'Campus Hubs (4)', isDark),
                ],
              ),
            ),
          ),

          const SizedBox(height: 10),

          // 3. Landmark Chips (Full Wrap so every building is visible)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: filteredBuildings.map((b) {
                final isSelected = b.id == _selectedBuilding.id;
                return InkWell(
                  onTap: () => _selectBuilding(b),
                  borderRadius: BorderRadius.circular(8),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF2563EB).withValues(alpha: isDark ? 0.28 : 0.14)
                          : (isDark ? const Color(0xFF1B2332) : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF2563EB)
                            : (isDark ? const Color(0xFF263249) : const Color(0xFFE2E8F0)),
                        width: isSelected ? 1.4 : 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          b.icon,
                          size: 13,
                          color: isSelected
                              ? const Color(0xFF2563EB)
                              : (isDark ? Colors.white70 : const Color(0xFF64748B)),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          b.name,
                          style: GoogleFonts.comfortaa(
                            fontSize: 10.5,
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                            color: isSelected
                                ? (isDark ? Colors.white : const Color(0xFF1D4ED8))
                                : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155)),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 12),

          // 4. Vector 2D Architectural Blueprint Canvas (440px Generous Height)
          Container(
            height: 440,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0B101C) : const Color(0xFFF6F8FB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? const Color(0xFF1E283C) : const Color(0xFFCBD5E1),
                width: 1.2,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final size = Size(constraints.maxWidth, constraints.maxHeight);
                  return GestureDetector(
                    onTapUp: (details) => _handleTapOnMap(details.localPosition, size),
                    child: Stack(
                      children: [
                        // Architectural Painter (Roads, Sector Boundary, Grid)
                        CustomPaint(
                          size: size,
                          painter: _AbesRealBlueprintPainter(
                            buildings: campusBuildings,
                            selectedBuildingId: _selectedBuilding.id,
                            isDark: isDark,
                          ),
                        ),

                        // Interactive Building Footprint Cards with Text & Icon
                        ...campusBuildings.map((b) {
                          final rect = Rect.fromLTWH(
                            b.relativeBounds.left * size.width,
                            b.relativeBounds.top * size.height,
                            b.relativeBounds.width * size.width,
                            b.relativeBounds.height * size.height,
                          );
                          final isSelected = b.id == _selectedBuilding.id;

                          return Positioned(
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height,
                            child: Tooltip(
                              message: "${b.name}\n${b.departmentTag}",
                              child: InkWell(
                                onTap: () => _selectBuilding(b),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? const Color(0xFFF97316).withValues(alpha: 0.3)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        b.icon,
                                        size: 15,
                                        color: isSelected
                                            ? const Color(0xFFF97316)
                                            : (isDark ? Colors.white70 : const Color(0xFF1E293B)),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        b.name
                                            .replaceAll('Academic Block', 'Block')
                                            .replaceAll('Hostel', 'Hst.'),
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.comfortaa(
                                          fontSize: 9.5,
                                          fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                                          color: isSelected
                                              ? const Color(0xFFF97316)
                                              : (isDark ? Colors.white : const Color(0xFF0F172A)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),

                        // Live Target Pin
                        if (_customPinNormalized != null)
                          Positioned(
                            left: (_customPinNormalized!.dx * size.width) - 15,
                            top: (_customPinNormalized!.dy * size.height) - 30,
                            child: const Icon(
                              Icons.location_on_rounded,
                              size: 30,
                              color: Color(0xFFEF4444),
                              shadows: [
                                BoxShadow(
                                  color: Colors.black54,
                                  blurRadius: 8,
                                  offset: Offset(0, 3),
                                ),
                              ],
                            ),
                          ),

                        // North Gate 2 Label (Top)
                        Positioned(
                          top: 4,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF182234) : const Color(0xFFE2E8F0),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                "▲ NORTH: HOSTEL SECTOR (BEHIND COLLEGE & GROUND • GATE 2)",
                                style: GoogleFonts.comfortaa(
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.6,
                                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ),
                        ),

                        // South Expressway Label (Bottom)
                        Positioned(
                          bottom: 3,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Text(
                              "▼ SOUTH: NH-09 (DELHI-MEERUT EXPRESSWAY • MAIN GATE 1)",
                              style: GoogleFonts.comfortaa(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.6,
                                color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),

          // 5. Bottom Detail Bar: Selected Building & Dynamic Floor Selector
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedBuilding.name,
                        style: GoogleFonts.comfortaa(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _selectedBuilding.departmentTag,
                        style: GoogleFonts.comfortaa(
                          fontSize: 10,
                          color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF182030) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isDark ? const Color(0xFF263249) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: floors.contains(_selectedFloor) ? _selectedFloor : floors.first,
                      dropdownColor: isDark ? const Color(0xFF141A26) : Colors.white,
                      style: GoogleFonts.comfortaa(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                      items: floors.map((f) {
                        return DropdownMenuItem(value: f, child: Text(f));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() => _selectedFloor = val);
                          _notifyParent();
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryPill(String catKey, String label, bool isDark) {
    final isSelected = _activeCategoryFilter == catKey;
    return InkWell(
      onTap: () => setState(() => _activeCategoryFilter = catKey),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF2563EB) : const Color(0xFF2563EB))
              : (isDark ? const Color(0xFF182234) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: GoogleFonts.comfortaa(
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? Colors.white : (isDark ? Colors.white60 : const Color(0xFF475569)),
          ),
        ),
      ),
    );
  }
}

class _AbesRealBlueprintPainter extends CustomPainter {
  final List<CampusLocationData> buildings;
  final String selectedBuildingId;
  final bool isDark;

  _AbesRealBlueprintPainter({
    required this.buildings,
    required this.selectedBuildingId,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Subtle Architectural Coordinate Grid
    final gridPaint = Paint()
      ..color = (isDark ? const Color(0xFF1A2336) : const Color(0xFFE2E8F0)).withValues(alpha: 0.5)
      ..strokeWidth = 0.8;

    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // 2. Campus Roads & Connecting Pathways
    final roadPaint = Paint()
      ..color = isDark ? const Color(0xFF141C2B) : const Color(0xFFE5E9F0)
      ..strokeWidth = 14.0
      ..strokeCap = StrokeCap.round;

    // South Entrance Avenue
    canvas.drawLine(
      Offset(size.width * 0.50, size.height * 0.98),
      Offset(size.width * 0.50, size.height * 0.77),
      roadPaint,
    );

    // Front Amenities Promenade (Cafes -> Nescafe -> Temple)
    canvas.drawLine(
      Offset(size.width * 0.08, size.height * 0.85),
      Offset(size.width * 0.92, size.height * 0.85),
      roadPaint,
    );

    // Front Academic Cross Avenue (Bhabha -> Courtyard -> Aryabhata)
    canvas.drawLine(
      Offset(size.width * 0.08, size.height * 0.77),
      Offset(size.width * 0.92, size.height * 0.77),
      roadPaint,
    );

    // Covered Connector Bridge (Bhabha to Ramanujan)
    final bridgePaint = Paint()
      ..color = isDark ? const Color(0xFF28364F) : const Color(0xFFCBD5E1)
      ..strokeWidth = 12.0
      ..strokeCap = StrokeCap.square;
    canvas.drawLine(
      Offset(size.width * 0.23, size.height * 0.65),
      Offset(size.width * 0.23, size.height * 0.60),
      bridgePaint,
    );

    // Central Academic Cross Avenue (Ramanujan -> Kalpana -> Business School)
    canvas.drawLine(
      Offset(size.width * 0.08, size.height * 0.61),
      Offset(size.width * 0.92, size.height * 0.61),
      roadPaint,
    );

    // Mid-North Cross Avenue (Academic row to Cricket Stadium)
    canvas.drawLine(
      Offset(size.width * 0.08, size.height * 0.43),
      Offset(size.width * 0.92, size.height * 0.43),
      roadPaint,
    );

    // Rear Cross Avenue (Cricket Stadium to Swimming Pool & Hostels)
    canvas.drawLine(
      Offset(size.width * 0.06, size.height * 0.24),
      Offset(size.width * 0.94, size.height * 0.24),
      roadPaint,
    );

    // Hostel Perimeter Road (Far Back)
    canvas.drawLine(
      Offset(size.width * 0.06, size.height * 0.05),
      Offset(size.width * 0.94, size.height * 0.05),
      roadPaint,
    );

    // Vertical West Connecting Avenue (Gate -> Cafes -> Bhabha -> Ramanujan -> Girls Hostel)
    canvas.drawLine(
      Offset(size.width * 0.06, size.height * 0.85),
      Offset(size.width * 0.06, size.height * 0.05),
      roadPaint,
    );

    // Vertical East Connecting Avenue (Gate -> Temple -> Aryabhata -> Business School -> Boys Hostels)
    canvas.drawLine(
      Offset(size.width * 0.94, size.height * 0.85),
      Offset(size.width * 0.94, size.height * 0.05),
      roadPaint,
    );

    // 3. Draw Building Architectural Footprints
    for (final b in buildings) {
      final rect = Rect.fromLTWH(
        b.relativeBounds.left * size.width,
        b.relativeBounds.top * size.height,
        b.relativeBounds.width * size.width,
        b.relativeBounds.height * size.height,
      );
      final isSelected = b.id == selectedBuildingId;

      Color defaultFill;
      if (b.footprintColor != null) {
        defaultFill = b.footprintColor!.withValues(alpha: isDark ? 0.30 : 0.18);
      } else {
        defaultFill = isDark ? const Color(0xFF161E2E) : Colors.white;
      }

      final bgPaint = Paint()
        ..color = isSelected
            ? const Color(0xFFF97316).withValues(alpha: isDark ? 0.35 : 0.22)
            : defaultFill;

      final strokePaint = Paint()
        ..color = isSelected
            ? const Color(0xFFF97316)
            : (b.footprintColor != null
                ? b.footprintColor!.withValues(alpha: 0.6)
                : (isDark ? const Color(0xFF28364F) : const Color(0xFFCBD5E1)))
        ..strokeWidth = isSelected ? 2.2 : 1.2
        ..style = PaintingStyle.stroke;

      final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(8));
      canvas.drawRRect(rrect, bgPaint);
      canvas.drawRRect(rrect, strokePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _AbesRealBlueprintPainter oldDelegate) {
    return oldDelegate.selectedBuildingId != selectedBuildingId || oldDelegate.isDark != isDark;
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../config/theme.dart';
import '../../models/map_marker_model.dart';
import '../../services/api_client.dart';
import '../../widgets/custom_map_pin.dart';

class AdminMapScreen extends StatefulWidget {
  const AdminMapScreen({Key? key}) : super(key: key);

  @override
  State<AdminMapScreen> createState() => _AdminMapScreenState();
}

class _AdminMapScreenState extends State<AdminMapScreen> {
  final ApiClient _apiClient = ApiClient();
  final MapController _mapController = MapController();
  List<MapMarkerModel> _markers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMarkers();
  }

  Future<void> _loadMarkers() async {
    setState(() => _isLoading = true);
    try {
      final markers = await _apiClient.fetchMapMarkers();
      if (!mounted) return;
      setState(() {
        _markers = markers;
      });
      _fitMapToMarkers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load map markers: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _fitMapToMarkers() {
    if (_markers.isEmpty) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final points = _markers.map((m) => LatLng(m.latitude, m.longitude)).toList();
      if (points.length == 1) {
        _mapController.move(points.first, 15.0);
      } else {
        final bounds = LatLngBounds.fromPoints(points);
        _mapController.fitCamera(
          CameraFit.bounds(
            bounds: bounds,
            padding: const EdgeInsets.all(60),
            maxZoom: 16.0,
          ),
        );
      }
    });
  }

  void _showCampusHealthModal() async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => FutureBuilder<List<dynamic>>(
        future: _apiClient.fetchCampusHealth(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const SizedBox(height: 200, child: Center(child: CircularProgressIndicator()));
          }
          final stats = snapshot.data ?? [];
          return Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Campus-Wide Health & Hotspots', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue)),
                const SizedBox(height: 4),
                const Text('Aggregated recurring issues by campus building / zone.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                const Divider(height: 20),
                Expanded(
                  child: ListView.builder(
                    itemCount: stats.length,
                    itemBuilder: (context, index) {
                      final item = stats[index];
                      return ListTile(
                        leading: const Icon(Icons.location_city, color: AppTheme.secondaryTeal),
                        title: Text(item['campus_zone']?.isNotEmpty == true ? item['campus_zone'] : 'General Campus'),
                        subtitle: Text('Dept: ${item['department']} | Avg Severity: ${(item['avg_severity'] ?? 0.0).toStringAsFixed(1)}/10'),
                        trailing: CircleAvatar(
                          backgroundColor: Colors.red.shade100,
                          child: Text('${item['total_issues']}', style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold)),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    LatLng initialCenter;
    if (_markers.isNotEmpty) {
      double sumLat = 0;
      double sumLng = 0;
      for (var m in _markers) {
        sumLat += m.latitude;
        sumLng += m.longitude;
      }
      initialCenter = LatLng(sumLat / _markers.length, sumLng / _markers.length);
    } else {
      initialCenter = const LatLng(28.6692, 77.4538);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Command Center'),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            tooltip: 'Campus Health View',
            onPressed: _showCampusHealthModal,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMarkers,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: initialCenter,
                    initialZoom: 14.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.acts.mobile',
                    ),
                    MarkerLayer(
                      markers: _markers.map((marker) {
                        return Marker(
                          point: LatLng(marker.latitude, marker.longitude),
                          width: 44,
                          height: 44,
                          child: CustomMapPin(
                            severity: marker.computedPriority.round(),
                            onTap: () {
                              _showMarkerSummary(marker);
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
                Positioned(
                  bottom: 20,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildLegendItem('1-3 Low', AppTheme.severityLow),
                        _buildLegendItem('4-6 Med', AppTheme.severityMedium),
                        _buildLegendItem('7-8 High', AppTheme.severityHigh),
                        _buildLegendItem('9-10 Critical', AppTheme.severityCritical),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }

  void _showMarkerSummary(MapMarkerModel marker) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    marker.title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.getSeverityColor(marker.computedPriority.round()).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Priority: ${marker.computedPriority.toStringAsFixed(1)}/10',
                    style: TextStyle(
                      color: AppTheme.getSeverityColor(marker.computedPriority.round()),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Zone: ${marker.campusZone.isNotEmpty ? marker.campusZone : "Campus"} | Dept: ${marker.department}'),
            const SizedBox(height: 4),
            Text('👥 Merged Citizen Reports: ${marker.crowdCount}'),
            if (marker.assignedCrewName != null) ...[
              const SizedBox(height: 4),
              Text('🔧 Assigned Crew: ${marker.assignedCrewName}', style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('DISMISS'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

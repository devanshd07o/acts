import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../config/theme.dart';
import '../config/api_constants.dart';

class ImagePreviewCard extends StatelessWidget {
  final XFile? imageFile;
  final String? networkUrl;
  final VoidCallback? onRemove;
  final double height;

  const ImagePreviewCard({
    super.key,
    this.imageFile,
    this.networkUrl,
    this.onRemove,
    this.height = 220,
  });

  String _resolveUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    final base = ApiConstants.baseUrl;
    final cleanPath = url.startsWith('/') ? url : '/$url';
    return '$base$cleanPath';
  }

  @override
  Widget build(BuildContext context) {
    if (imageFile == null && (networkUrl == null || networkUrl!.isEmpty)) {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(15),
        child: Stack(
          children: [
            Container(
              height: height,
              width: double.infinity,
              color: const Color(0xFFF1F5F9),
              child: imageFile != null
                  ? (kIsWeb
                      ? Image.network(
                          imageFile!.path,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _errorPlaceholder(),
                        )
                      : Image.file(
                          File(imageFile!.path),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _errorPlaceholder(),
                        ))
                  : Image.network(
                      _resolveUrl(networkUrl!),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _errorPlaceholder(),
                    ),
            ),
            if (onRemove != null)
              Positioned(
                top: 10,
                right: 10,
                child: Material(
                  color: Colors.black.withValues(alpha: 0.65),
                  shape: const CircleBorder(),
                  child: InkWell(
                    onTap: onRemove,
                    customBorder: const CircleBorder(),
                    child: const Padding(
                      padding: EdgeInsets.all(6),
                      child: Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _errorPlaceholder() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.broken_image_rounded, size: 40, color: AppTheme.textMuted),
          SizedBox(height: 6),
          Text(
            'Unable to load preview',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }
}

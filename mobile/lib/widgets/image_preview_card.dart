import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../config/theme.dart';

class ImagePreviewCard extends StatelessWidget {
  final XFile? imageFile;
  final String? networkUrl;
  final VoidCallback? onRemove;

  const ImagePreviewCard({
    Key? key,
    this.imageFile,
    this.networkUrl,
    this.onRemove,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (imageFile == null && (networkUrl == null || networkUrl!.isEmpty)) {
      return const SizedBox.shrink();
    }

    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            height: 200,
            width: double.infinity,
            color: Colors.grey[200],
            child: imageFile != null
                ? Image.network(
                    imageFile!.path,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Center(
                      child: Icon(Icons.broken_image, size: 48, color: AppTheme.textMuted),
                    ),
                  )
                : Image.network(
                    networkUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Center(
                      child: Icon(Icons.broken_image, size: 48, color: AppTheme.textMuted),
                    ),
                  ),
          ),
        ),
        if (onRemove != null)
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

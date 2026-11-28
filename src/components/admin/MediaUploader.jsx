import { useState, useRef } from 'react';
import {
  Upload,
  X,
  Star,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  uploadProductImage,
  deleteStorageFile,
  validateImageFile,
} from '../../services/storageService';
import './MediaUploader.css';

/**
 * MediaUploader Component for Admin Product Form
 *
 * Allows:
 * - Multi-image upload to Firebase Storage
 * - Real-time progress indicators
 * - Client-side image compression
 * - Setting primary hero image
 * - Re-ordering images (sort order)
 * - Removing images (and deleting from storage if uploaded)
 * - Keeping existing local image URLs (e.g. /assets/axor/...)
 */
export default function MediaUploader({
  images = [],
  onChange,
  productId = 'general',
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    setUploading(true);
    setUploadProgress(0);

    const newUploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error);
        setUploading(false);
        return;
      }

      try {
        const result = await uploadProductImage(
          file,
          productId,
          (percent) => {
            // Calculate overall batch progress
            const overall = Math.round(((i + percent / 100) / files.length) * 100);
            setUploadProgress(overall);
          }
        );

        newUploaded.push({
          url: result.url,
          storagePath: result.storagePath,
          alt: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          isPrimary: images.length === 0 && newUploaded.length === 0, // first image becomes primary if none exist
          sortOrder: images.length + newUploaded.length,
        });
      } catch (err) {
        setError(`Failed to upload ${file.name}: ${err.message}`);
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';

    onChange([...images, ...newUploaded]);
  };

  const handleRemove = async (index) => {
    const target = images[index];
    if (target?.storagePath) {
      // Async delete without blocking UI
      deleteStorageFile(target.storagePath);
    }

    const updated = images.filter((_, i) => i !== index);
    // If we removed the primary image, mark first remaining as primary
    if (target.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (index) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Update sortOrder
    const reordered = updated.map((img, i) => ({ ...img, sortOrder: i }));
    onChange(reordered);
  };

  return (
    <div className="admin-media-uploader">
      <div className="admin-media-uploader__header">
        <div>
          <label className="admin-media-uploader__title">Product Photos & Gallery</label>
          <p className="admin-media-uploader__sub">
            Upload genuine high-resolution helmet photos (JPG, PNG, WebP &le; 5MB). Images are auto-compressed.
          </p>
        </div>
        <button
          type="button"
          className="admin-media-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 size={15} className="admin-media-spin" />
          ) : (
            <Upload size={15} />
          )}
          <span>{uploading ? `Uploading ${uploadProgress}%` : 'Upload Images'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="admin-media-hidden-input"
          onChange={handleFilesSelected}
        />
      </div>

      {error && (
        <div className="admin-media-error" role="alert">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {uploading && (
        <div className="admin-media-progress-bar">
          <div
            className="admin-media-progress-fill"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {images.length === 0 ? (
        <div className="admin-media-empty" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={32} className="admin-media-empty__icon" />
          <span>No gallery photos uploaded yet. Click to select files.</span>
        </div>
      ) : (
        <div className="admin-media-grid">
          {images.map((img, idx) => (
            <div
              key={img.url || idx}
              className={`admin-media-item ${img.isPrimary ? 'is-primary' : ''}`}
            >
              <img
                src={img.url}
                alt={img.alt || `Photo ${idx + 1}`}
                className="admin-media-item__img"
                loading="lazy"
              />

              <div className="admin-media-item__overlay">
                <button
                  type="button"
                  className={`admin-media-item__btn ${img.isPrimary ? 'is-primary-active' : ''}`}
                  onClick={() => handleSetPrimary(idx)}
                  title={img.isPrimary ? 'Primary Display Photo' : 'Set as Primary Photo'}
                >
                  <Star size={13} fill={img.isPrimary ? '#fbbf24' : 'none'} />
                </button>

                <div className="admin-media-item__reorder">
                  <button
                    type="button"
                    className="admin-media-item__btn"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    title="Move earlier"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    className="admin-media-item__btn"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === images.length - 1}
                    title="Move later"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <button
                  type="button"
                  className="admin-media-item__btn admin-media-item__btn--delete"
                  onClick={() => handleRemove(idx)}
                  title="Remove image"
                >
                  <X size={13} />
                </button>
              </div>

              {img.isPrimary && (
                <span className="admin-media-item__badge">Primary</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

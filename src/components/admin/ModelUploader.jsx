import { useState, useRef } from 'react';
import {
  Box,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  uploadProduct3DModel,
  deleteStorageFile,
  validateModelFile,
} from '../../services/storageService';
import ModelViewer3D from '../three/ModelViewer3D';
import './ModelUploader.css';

/**
 * ModelUploader Component for Admin Product Form
 *
 * Handles:
 * - Uploading real .glb / .gltf 3D model files
 * - File size and format validation (<=30MB)
 * - Upload progress indicator
 * - In-place 3D interactive preview before saving
 * - Enable / Disable 3D preview toggle
 * - Safe model replacement or removal
 */
export default function ModelUploader({
  model3D = { enabled: false, url: '', storagePath: '', format: 'glb' },
  onChange,
  productId = 'general',
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const validation = validateModelFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // If there was an old file in storage, delete it
      if (model3D?.storagePath) {
        deleteStorageFile(model3D.storagePath);
      }

      const res = await uploadProduct3DModel(file, productId, (percent) => {
        setUploadProgress(percent);
      });

      onChange({
        enabled: true,
        url: res.url,
        storagePath: res.storagePath,
        format: res.format,
        name: res.name,
      });
      setShowPreview(true);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (model3D?.storagePath) {
      deleteStorageFile(model3D.storagePath);
    }
    onChange({
      enabled: false,
      url: '',
      storagePath: '',
      format: 'glb',
    });
    setShowPreview(false);
  };

  const toggleEnabled = (e) => {
    onChange({
      ...model3D,
      enabled: e.target.checked,
    });
  };

  return (
    <div className="admin-model-uploader">
      <div className="admin-model-uploader__head">
        <div>
          <label className="admin-model-uploader__title">
            <Box size={16} aria-hidden="true" />
            <span>Interactive 3D Helmet Model (.glb / .gltf)</span>
          </label>
          <p className="admin-model-uploader__sub">
            Upload actual 3D polygon geometry (max 30 MB). Photographs are not 3D models.
          </p>
        </div>

        {model3D?.url && (
          <label className="admin-model-enable-toggle">
            <input
              type="checkbox"
              checked={Boolean(model3D?.enabled)}
              onChange={toggleEnabled}
            />
            <span>Enable 3D on public page</span>
          </label>
        )}
      </div>

      {error && (
        <div className="admin-model-error" role="alert">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {uploading && (
        <div className="admin-model-progress-wrap">
          <div className="admin-model-progress-bar">
            <div
              className="admin-model-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="admin-model-progress-text">
            Uploading 3D model: {uploadProgress}%
          </span>
        </div>
      )}

      <div className="admin-model-action-row">
        <button
          type="button"
          className="admin-model-btn admin-model-btn--primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 size={15} className="admin-model-spin" />
          ) : (
            <Upload size={15} />
          )}
          <span>{model3D?.url ? 'Replace 3D Model' : 'Upload .GLB / .GLTF'}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          className="admin-model-hidden-input"
          onChange={handleFileSelected}
        />

        {model3D?.url && (
          <>
            <button
              type="button"
              className="admin-model-btn admin-model-btn--ghost"
              onClick={() => setShowPreview((prev) => !prev)}
            >
              <Eye size={15} />
              <span>{showPreview ? 'Hide 3D Preview' : 'Test 3D Preview'}</span>
            </button>

            <button
              type="button"
              className="admin-model-btn admin-model-btn--danger"
              onClick={handleRemove}
              title="Delete 3D model"
            >
              <X size={15} />
              <span>Remove</span>
            </button>
          </>
        )}
      </div>

      {model3D?.url && (
        <div className="admin-model-info">
          <CheckCircle2 size={14} className="admin-model-check" />
          <span className="admin-model-path">
            File attached ({model3D.format?.toUpperCase() || 'GLB'}).
          </span>
        </div>
      )}

      {showPreview && model3D?.url && (
        <div className="admin-model-preview-container">
          <ModelViewer3D modelUrl={model3D.url} height="360px" />
        </div>
      )}
    </div>
  );
}

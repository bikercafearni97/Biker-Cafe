/**
 * Firebase Storage Service for Product Images and 3D Models (.glb / .gltf)
 *
 * Handles:
 * - Client-side image compression using canvas before upload
 * - File format and size validation
 * - Progress tracking callbacks
 * - Upload to Firebase Storage with proper metadata
 * - Safe file deletion
 */
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../firebase';

export const STORAGE_PATHS = {
  IMAGES: 'products/images',
  MODELS: 'products/models',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_MODEL_SIZE = 30 * 1024 * 1024; // 30 MB

/**
 * Validates image file type and size.
 * Supported: image/jpeg, image/png, image/webp
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format "${file.type || 'unknown'}". Supported formats: JPG, PNG, WebP.`,
    };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 5 MB limit.`,
    };
  }
  return { valid: true };
}

/**
 * Validates 3D model file (.glb / .gltf).
 */
export function validateModelFile(file) {
  if (!file) {
    return { valid: false, error: 'No model file provided.' };
  }
  const name = file.name.toLowerCase();
  const isExtValid = name.endsWith('.glb') || name.endsWith('.gltf');
  if (!isExtValid) {
    return {
      valid: false,
      error: 'Invalid 3D model format. Supported formats: .glb or .gltf only.',
    };
  }
  if (file.size > MAX_MODEL_SIZE) {
    return {
      valid: false,
      error: `Model file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 30 MB limit.`,
    };
  }
  return { valid: true };
}

/**
 * Compresses an image client-side to JPEG/WebP before upload.
 * Reduces dimension if wider than maxDimension (default 1600px).
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.85) {
  // If browser doesn't support Image or file isn't compressable image
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const targetType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compression didn't reduce size or failed, use original
              resolve(file);
            } else {
              const compressedFile = new File([blob], file.name, {
                type: targetType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          targetType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a product image to Firebase Storage with progress tracking.
 *
 * @param {File} file
 * @param {string} productId
 * @param {function} onProgress (progressNumber 0-100)
 * @returns {Promise<{ url: string, storagePath: string, name: string }>}
 */
export async function uploadProductImage(file, productId = 'general', onProgress = null) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Compress first
  const fileToUpload = await compressImage(file);

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `${STORAGE_PATHS.IMAGES}/${productId}_${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, fileToUpload, {
    contentType: fileToUpload.type,
    customMetadata: {
      productId,
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            storagePath,
            name: file.name,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Uploads a 3D model file (.glb / .gltf) to Firebase Storage with progress tracking.
 *
 * @param {File} file
 * @param {string} productId
 * @param {function} onProgress (progressNumber 0-100)
 * @returns {Promise<{ url: string, storagePath: string, name: string, format: string }>}
 */
export async function uploadProduct3DModel(file, productId = 'general', onProgress = null) {
  const validation = validateModelFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const format = file.name.toLowerCase().endsWith('.glb') ? 'glb' : 'gltf';
  const timestamp = Date.now();
  const storagePath = `${STORAGE_PATHS.MODELS}/${productId}_${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: format === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
    customMetadata: {
      productId,
      format,
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            storagePath,
            name: file.name,
            format,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Delete a file from Firebase Storage given its storagePath.
 * Fails safely if the file doesn't exist or if it's an external URL.
 */
export async function deleteStorageFile(storagePath) {
  if (!storagePath || !storagePath.startsWith('products/')) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    // If already deleted or not found, silently succeed
    if (err.code !== 'storage/object-not-found') {
      console.warn('Failed to delete storage file:', storagePath, err);
    }
  }
}

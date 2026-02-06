/**
 * Upload Service
 * Handles file uploads to the server (S3 mounted path or local uploads folder).
 */

import { getAuthAdapter } from './auth-adapter';
import { ApiError } from './api-client';

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface UploadOptions {
  /** Optional filename to use (defaults to original filename) */
  filename?: string;
  /** Optional callback for upload progress */
  onProgress?: (progress: number) => void;
}

/**
 * Convert a data URL to a Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const header = parts[0] || '';
  const base64Data = parts[1] || '';
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mime });
}

/**
 * Get the file extension from a mime type
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return mimeToExt[mimeType] || 'bin';
}

class UploadService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  }

  /**
   * Upload an avatar image
   * @param file - File, Blob, or data URL string
   * @param options - Upload options
   * @returns Upload response with the URL to the uploaded file
   */
  async uploadAvatar(
    file: File | Blob | string,
    options: UploadOptions = {}
  ): Promise<UploadResponse> {
    let blob: Blob;
    let filename: string;

    // Handle different input types
    if (typeof file === 'string') {
      // Data URL
      blob = dataURLtoBlob(file);
      const ext = getExtensionFromMime(blob.type);
      filename = options.filename || `avatar.${ext}`;
    } else if (file instanceof File) {
      blob = file;
      filename = options.filename || file.name;
    } else {
      blob = file;
      const ext = getExtensionFromMime(blob.type);
      filename = options.filename || `avatar.${ext}`;
    }

    return this.upload('/v1/uploads/avatar', blob, filename, options.onProgress);
  }

  /**
   * Generic file upload method
   */
  private async upload(
    endpoint: string,
    blob: Blob,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', blob, filename);

    const token = getAuthAdapter().getAccessToken();
    const url = `${this.baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    // Use XMLHttpRequest for progress tracking if callback provided
    if (onProgress) {
      return this.uploadWithProgress(url, formData, token, onProgress);
    }

    // Use fetch for simpler uploads
    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }

      const message = this.extractErrorMessage(errorData, response.status);
      throw new ApiError(message, response.status);
    }

    const data = (await response.json()) as { success: boolean; data?: UploadResponse };

    if (data.success && data.data) {
      return data.data;
    }

    // Handle non-envelope response
    return data as unknown as UploadResponse;
  }

  /**
   * Upload with XMLHttpRequest for progress tracking
   */
  private uploadWithProgress(
    url: string,
    formData: FormData,
    token: string | null,
    onProgress: (progress: number) => void
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { success: boolean; data?: UploadResponse };
            if (data.success && data.data) {
              resolve(data.data);
            } else {
              resolve(data as unknown as UploadResponse);
            }
          } catch {
            reject(new ApiError('Invalid response from server', xhr.status));
          }
        } else {
          let errorData: unknown;
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            errorData = undefined;
          }
          const message = this.extractErrorMessage(errorData, xhr.status);
          reject(new ApiError(message, xhr.status));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError('Upload failed', 0));
      });

      xhr.addEventListener('abort', () => {
        reject(new ApiError('Upload aborted', 0));
      });

      xhr.open('POST', url);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  /**
   * Extract error message from response
   */
  private extractErrorMessage(data: unknown, status: number): string {
    if (data && typeof data === 'object') {
      const obj = data as { error?: { message?: string }; message?: string };
      if (obj.error?.message) return obj.error.message;
      if (obj.message) return obj.message;
    }
    return `Upload failed with status ${status}`;
  }
}

// Export singleton instance
export const uploadService = new UploadService();

// Export types
export type { UploadResponse, UploadOptions };

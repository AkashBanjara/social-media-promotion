import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MIN_DIMENSION_PX = 320; // below this, most platforms will reject/degrade quality

export interface CloudinaryUploadResult {
  url: string; // publicly accessible HTTPS delivery URL (required by IG/FB publishing APIs)
  publicId: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

/**
 * Uploads a buffer to Cloudinary and returns the public HTTPS URL.
 * Instagram/Facebook publishing requires a public URL — Cloudinary's default
 * delivery URLs satisfy this without us needing to manage our own file host.
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder = 'marketing-panel/posts'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload returned no result.'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported file type "${file.type}". Allowed: JPEG, PNG, WEBP.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is ${
      MAX_IMAGE_SIZE_BYTES / 1024 / 1024
    }MB.`;
  }
  return null;
}

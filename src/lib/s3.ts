import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'ipam-connect-files';
const PRESIGNED_URL_EXPIRY = 5 * 60; // 5 minutes in seconds

export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  courseId: string
) {
  try {
    const key = `uploads/${courseId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        courseId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
    });

    return {
      presignedUrl,
      key,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

export async function getPresignedDownloadUrl(key: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
    });

    return presignedUrl;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw error;
  }
}

export { s3Client };

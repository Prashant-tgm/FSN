import {
  Injectable, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client, DeleteObjectCommand, HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'video/mp4':  'mp4',
  'application/pdf': 'pdf',
};

const MAX_IMAGE_SIZE = 5   * 1024 * 1024;  //   5 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100 MB
const MAX_DOC_SIZE   = 10  * 1024 * 1024;  //  10 MB

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor(private config: ConfigService) {
    this.bucket  = config.get<string>('aws.s3Bucket', 'fsn-media-dev');
    this.cdnUrl  = config.get<string>('aws.cloudfrontUrl', '');

    this.s3 = new S3Client({
      region: config.get<string>('aws.region', 'ap-south-1'),
      credentials: {
        accessKeyId:     config.get<string>('aws.accessKeyId', ''),
        secretAccessKey: config.get<string>('aws.secretAccessKey', ''),
      },
    });
  }

  /**
   * Generate an S3 pre-signed POST URL.
   * The client uploads directly to S3 — no media bytes touch the API server.
   */
  async getPresignedUploadUrl(
    userId: string,
    contentType: string,
    folder: 'problems' | 'solutions' | 'profiles' | 'blogs' | 'cocreation',
  ) {
    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
      throw new BadRequestException(
        `Unsupported file type: ${contentType}. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}`,
      );
    }

    const maxSize = contentType.startsWith('video/')
      ? MAX_VIDEO_SIZE
      : contentType === 'application/pdf'
      ? MAX_DOC_SIZE
      : MAX_IMAGE_SIZE;

    const key = `${folder}/${userId}/${uuidv4()}.${ext}`;

    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 1, maxSize],
        ['eq', '$Content-Type', contentType],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: 300, // 5 minutes
    });

    const publicUrl = this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`;

    this.logger.debug(`Pre-signed URL generated: ${key}`);
    return { uploadUrl: url, fields, publicUrl, key, expiresIn: 300 };
  }

  async deleteMedia(key: string, requesterId: string) {
    // Validate the file belongs to the requesting user (key includes userId segment)
    const keySegments = key.split('/');
    if (keySegments.length < 3 || keySegments[1] !== requesterId) {
      throw new ForbiddenException('You can only delete your own media files');
    }

    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return { message: 'Media deleted successfully', key };
    } catch (err) {
      this.logger.error(`S3 delete failed for key ${key}: ${err.message}`);
      throw err;
    }
  }
}
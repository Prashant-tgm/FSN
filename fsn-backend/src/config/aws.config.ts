import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  s3Bucket: process.env.AWS_S3_BUCKET || 'fsn-media-dev',
  cloudfrontUrl: process.env.AWS_CLOUDFRONT_URL || '',
  sesFromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@fsnplatform.org',
  sesRegion: process.env.AWS_SES_REGION || 'ap-south-1',
  msg91ApiKey: process.env.MSG91_API_KEY || '',
  msg91SenderId: process.env.MSG91_SENDER_ID || 'FSN',
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID || '',
}));

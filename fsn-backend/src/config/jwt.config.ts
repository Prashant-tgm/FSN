import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  privateKey: (process.env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  publicKey: (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n'),
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  algorithm: 'RS256' as const,
}));

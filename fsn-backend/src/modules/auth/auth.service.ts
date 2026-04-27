import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { GoogleUser } from './strategies/google.strategy';
import { UserRole } from '../../common/enums';
import { MailService } from '../notifications/mail.service';

const BCRYPT_ROUNDS = 12;
const OTP_TTL_SECONDS = 300;   // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const SESSION_TTL_SECONDS = 86400; // 24 hours

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRedis() private redis: Redis,
    private mailService: MailService,
  ) {}

  // ── Registration ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        existing.email === dto.email
          ? 'An account with this email already exists'
          : 'An account with this phone number already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: (dto.role as any) || 'bop_user',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`New user registered: ${user.email} (${user.role})`);

    // Generate and send OTP for email verification
    await this.initiateEmailVerification(user.id, user.email!);

    return { 
      user, 
      needsVerification: true,
      message: 'Registration successful. Please verify your email with the OTP sent.' 
    };
  }

  // ── Local Login ─────────────────────────────────────────────────────────────

  async validateLocalUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        avatarUrl: true,
        passwordHash: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted) return null;
    if (!user.passwordHash) return null; // OAuth-only account

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return { id: user.id, email: user.email, role: user.role, fullName: user.fullName, avatarUrl: user.avatarUrl };
  }

  async login(userId: string, email: string, role: string) {
    return this.issueTokens(userId, email, role);
  }

  // ── OTP Flow ────────────────────────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    const attemptsKey = `otp:attempts:${phone}`;
    const attempts = await this.redis.get(attemptsKey);

    if (attempts && parseInt(attempts) >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many OTP attempts. Please wait 15 minutes before retrying.',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${phone}`;

    await this.redis.setex(otpKey, OTP_TTL_SECONDS, otp);
    await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, 900); // 15-min lockout window

    // In production: call MSG91 API to send SMS
    // await this.smsService.send(phone, `Your FSN verification code: ${otp}`);
    this.logger.debug(`[DEV] OTP for ${phone}: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string) {
    const otpKey = `otp:${phone}`;
    const stored = await this.redis.get(otpKey);

    if (!stored || stored !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redis.del(otpKey);

    // Upsert user by phone — creates account on first OTP verification
    const user = await this.prisma.user.upsert({
      where: { phone },
      create: {
        phone,
        fullName: `User ${phone.slice(-4)}`,
        role: 'bop_user',
      },
      update: {},
      select: { id: true, email: true, fullName: true, role: true },
    });

    const tokens = await this.issueTokens(user.id, user.email || phone, user.role);
    return { user, ...tokens };
  }

  // ── Email OTP Flow ─────────────────────────────────────────────────────────

  async initiateEmailVerification(userId: string, email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { otpCode: otp, otpExpiresAt: expiresAt },
    });

    await this.mailService.sendOtp(email, otp);
  }

  async verifyEmailOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) return { message: 'Email already verified' };

    if (!user.otpCode || user.otpCode !== otp) {
      throw new BadRequestException('Invalid verification code');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });

    const tokens = await this.issueTokens(updatedUser.id, updatedUser.email!, updatedUser.role);
    return { user: updatedUser, ...tokens };
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────────

  async handleGoogleCallback(googleUser: GoogleUser) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { oauthProvider: 'google', oauthId: googleUser.oauthId },
          { email: googleUser.email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          fullName: googleUser.fullName,
          avatarUrl: googleUser.avatarUrl,
          oauthProvider: googleUser.oauthProvider,
          oauthId: googleUser.oauthId,
          role: 'innovator', // Google logins default to innovator
        },
      });
      this.logger.log(`New Google OAuth user: ${user.email}`);
    } else if (!user.oauthId) {
      // Link OAuth to existing email account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: googleUser.oauthProvider,
          oauthId: googleUser.oauthId,
          avatarUrl: user.avatarUrl || googleUser.avatarUrl,
        },
      });
    }

    const tokens = await this.issueTokens(user.id, user.email!, user.role);
    return { user, ...tokens };
  }

  // ── Token Management ─────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string) {
    // Verify the refresh token
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.publicKey'),
        algorithms: ['RS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check it exists in Redis (not revoked)
    const sessionKey = `session:refresh:${payload.sub}`;
    const stored = await this.redis.get(sessionKey);
    if (!stored) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isDeleted: true },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueTokens(user.id, user.email!, user.role);
  }

  async logout(userId: string): Promise<{ message: string }> {
    const sessionKey = `session:refresh:${userId}`;
    await this.redis.del(sessionKey);
    return { message: 'Logged out successfully' };
  }

  // ── Private Helpers ──────────────────────────────────────────────────────────

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        privateKey: this.config.get<string>('jwt.privateKey'),
        algorithm: 'RS256',
        expiresIn: this.config.get<string>('jwt.accessExpiresIn', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        privateKey: this.config.get<string>('jwt.privateKey'),
        algorithm: 'RS256',
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn', '30d'),
      }),
    ]);

    // Store refresh token in Redis for revocation support
    const sessionKey = `session:refresh:${userId}`;
    await this.redis.setex(sessionKey, 30 * 24 * 3600, refreshToken);

    return { accessToken, refreshToken };
  }
}

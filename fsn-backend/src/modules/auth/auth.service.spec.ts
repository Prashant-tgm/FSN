import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../notifications/mail.service';
import * as bcrypt from 'bcrypt';

const REDIS_TOKEN = 'IOREDIS';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'rohan@example.com',
    fullName: 'Rohan Mehta',
    role: 'innovator',
    passwordHash: null,
    isDeleted: false,
    createdAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findFirst:  jest.fn(),
      findUnique: jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      upsert:     jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verify:    jest.fn(),
  };

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      const map: Record<string, any> = {
        'jwt.privateKey': 'mock-private-key',
        'jwt.accessExpiresIn': '15m',
        'jwt.refreshExpiresIn': '30d',
      };
      return map[key] ?? null;
    }),
  };

  const mockMailService = {
    sendOtp: jest.fn().mockResolvedValue(true),
  };

  const mockRedis = {
    setex: jest.fn().mockResolvedValue('OK'),
    get:   jest.fn().mockResolvedValue(null),
    del:   jest.fn().mockResolvedValue(1),
    incr:  jest.fn().mockResolvedValue(1),
    expire:jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService,    useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: REDIS_TOKEN,   useValue: mockRedis },
        { provide: MailService,   useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('creates a new user and requires verification', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser, passwordHash: 'hash',
      });
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser, passwordHash: 'hash', otpCode: '123456'
      });
      mockJwt.signAsync.mockResolvedValue('access-token');

      const result = await service.register({
        fullName: 'Rohan Mehta',
        email: 'rohan@example.com',
        password: 'SecurePass@123',
        phone: '+919876543210',
        role: 'innovator' as any,
      });

      expect(result.user.email).toBe('rohan@example.com');
      expect(result.needsVerification).toBe(true);
      expect(result.message).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException if email already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.register({
          fullName: 'Duplicate',
          email: 'rohan@example.com',
          password: 'SecurePass@123',
          phone: '+919876543210',
          role: 'innovator' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateLocalUser()', () => {
    it('returns null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateLocalUser('x@x.com', 'pass');
      expect(result).toBeNull();
    });

    it('returns null for OAuth-only account (no passwordHash)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });
      const result = await service.validateLocalUser('rohan@example.com', 'pass');
      expect(result).toBeNull();
    });

    it('returns user for valid credentials', async () => {
      const hash = await bcrypt.hash('SecurePass@123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser, passwordHash: hash,
      });

      const result = await service.validateLocalUser('rohan@example.com', 'SecurePass@123');
      expect(result).not.toBeNull();
      expect(result!.email).toBe('rohan@example.com');
    });
  });

  describe('verifyOtp()', () => {
    it('throws UnauthorizedException for wrong OTP', async () => {
      mockRedis.get.mockResolvedValue('123456');

      await expect(
        service.verifyOtp('+919876543210', '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('creates user and returns tokens on valid OTP', async () => {
      mockRedis.get.mockResolvedValue('482951');
      mockRedis.del.mockResolvedValue(1);
      mockPrisma.user.upsert.mockResolvedValue(mockUser);
      mockJwt.signAsync.mockResolvedValue('access-token');

      const result = await service.verifyOtp('+919876543210', '482951');
      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('logout()', () => {
    it('deletes session from redis', async () => {
      await service.logout('user-uuid-1');
      expect(mockRedis.del).toHaveBeenCalledWith('session:refresh:user-uuid-1');
    });
  });
});
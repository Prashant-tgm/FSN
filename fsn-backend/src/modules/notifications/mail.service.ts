import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {}

  async sendOtp(email: string, otp: string) {
    this.logger.log(`[MOCK MAIL] Sending OTP ${otp} to ${email}`);
    
    // In production, use Nodemailer, AWS SES, or SendGrid here.
    // Example with console for now as requested.
    console.log(`
    ---------------------------------------------------
    FSN EMAIL VERIFICATION
    To: ${email}
    Subject: Your Verification Code
    
    Your code is: ${otp}
    It will expire in 10 minutes.
    ---------------------------------------------------
    `);
  }
}

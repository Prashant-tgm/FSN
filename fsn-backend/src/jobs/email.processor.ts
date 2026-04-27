import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';
import { QueueName, EmailJobName } from '../common/enums';

export interface VerificationEmailJob {
  to: string;
  fullName: string;
  verificationUrl: string;
}

export interface FeedbackPromptEmailJob {
  to: string;
  fullName: string;
  solutionTitle: string;
  solutionId: string;
  checkpoint: string;
  feedbackUrl: string;
}

@Processor(QueueName.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private ses: SESClient;
  private fromEmail: string;

  constructor(private config: ConfigService) {
    this.ses = new SESClient({
      region: config.get<string>('aws.sesRegion', 'ap-south-1'),
      credentials: {
        accessKeyId:     config.get<string>('aws.accessKeyId', ''),
        secretAccessKey: config.get<string>('aws.secretAccessKey', ''),
      },
    });
    this.fromEmail = config.get<string>('aws.sesFromEmail', 'noreply@fsnplatform.org');
  }

  @Process(EmailJobName.SEND_VERIFICATION)
  async sendVerification(job: Job<VerificationEmailJob>) {
    const { to, fullName, verificationUrl } = job.data;
    await this.sendEmail({
      to,
      subject: 'Verify your FSN account',
      html: this.buildVerificationTemplate(fullName, verificationUrl),
    });
    this.logger.log(`Verification email sent to ${to}`);
  }

  @Process(EmailJobName.SEND_FEEDBACK_PROMPT)
  async sendFeedbackPrompt(job: Job<FeedbackPromptEmailJob>) {
    const { to, fullName, solutionTitle, checkpoint, feedbackUrl } = job.data;
    await this.sendEmail({
      to,
      subject: `Time for your ${checkpoint} feedback on: ${solutionTitle}`,
      html: this.buildFeedbackPromptTemplate(fullName, solutionTitle, checkpoint, feedbackUrl),
    });
    this.logger.log(`Feedback prompt (${checkpoint}) sent to ${to}`);
  }

  @Process(EmailJobName.SEND_WELCOME)
  async sendWelcome(job: Job<{ to: string; fullName: string }>) {
    const { to, fullName } = job.data;
    await this.sendEmail({
      to,
      subject: 'Welcome to the Frugal Solutions Network 🌱',
      html: this.buildWelcomeTemplate(fullName),
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private async sendEmail(params: { to: string; subject: string; html: string }) {
    const command = new SendEmailCommand({
      Source: `Frugal Solutions Network <${this.fromEmail}>`,
      Destination: { ToAddresses: [params.to] },
      Message: {
        Subject: { Data: params.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: params.html, Charset: 'UTF-8' },
        },
      },
    });

    try {
      await this.ses.send(command);
    } catch (err) {
      this.logger.error(`SES send failed to ${params.to}: ${err.message}`);
      throw err;
    }
  }

  private buildVerificationTemplate(name: string, url: string): string {
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#166534">Frugal Solutions Network</h2>
        <p>Hi ${name},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${url}" style="display:inline-block;background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#78716C;font-size:13px;margin-top:24px">
          This link expires in 24 hours. If you didn't create an FSN account, please ignore this email.
        </p>
      </div>`;
  }

  private buildFeedbackPromptTemplate(
    name: string, solutionTitle: string,
    checkpoint: string, url: string,
  ): string {
    const checkpointLabels: Record<string, string> = {
      week1: '1-week', month1: '1-month', month3: '3-month', month6: '6-month',
    };
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#166534">Time for your ${checkpointLabels[checkpoint] ?? checkpoint} feedback</h2>
        <p>Hi ${name},</p>
        <p>How has the solution <strong>${solutionTitle}</strong> worked out for your community?</p>
        <p>Your feedback helps us measure real-world impact and improve the solution for others.</p>
        <a href="${url}" style="display:inline-block;background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Submit Feedback →
        </a>
        <p style="color:#78716C;font-size:13px;margin-top:24px">
          It takes less than 3 minutes. Your feedback is public by default.
        </p>
      </div>`;
  }

  private buildWelcomeTemplate(name: string): string {
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#166534">Welcome to FSN 🌱</h2>
        <p>Hi ${name}, welcome to the Frugal Solutions Network!</p>
        <p>You can now browse problems, submit solutions, and contribute to building real-world impact for communities at the grassroots.</p>
        <a href="https://fsnplatform.org/problems" style="display:inline-block;background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Explore Problems →
        </a>
      </div>`;
  }
}

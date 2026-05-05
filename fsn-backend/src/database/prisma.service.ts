import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this.$connect();
        // Ping the database to ensure it is actually ready to accept queries
        await this.$queryRawUnsafe('SELECT 1');
        this.logger.log('PostgreSQL connected via Prisma');
        break;
      } catch (err: any) {
        this.logger.error(`Database connection failed. Retries left: ${retries - 1}`, err.message);
        retries -= 1;
        if (retries === 0) {
          this.logger.error('Could not connect to the PostgreSQL database after multiple retries.');
          throw err;
        }
        // Wait 3 seconds before retrying
        await new Promise(res => setTimeout(res, 3000));
      }
    }

    // Log slow queries (> 500ms) in development
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: any) => {
        if (e.duration > 500) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('PostgreSQL disconnected');
  }

  /**
   * Soft-delete helper — sets is_deleted = true on any table that has the field.
   * Usage: prisma.softDelete('user', { id: userId })
   */
  async softDelete(model: string, where: Record<string, any>) {
    return (this as any)[model].update({
      where,
      data: { isDeleted: true },
    });
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbUrl = config.databaseUrl.startsWith('file:')
      ? config.databaseUrl.replace(/^file:/, '')
      : 'prisma/dev.db';
    const dbPath = path.isAbsolute(dbUrl) ? dbUrl : path.resolve(process.cwd(), dbUrl);
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` } as any);
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

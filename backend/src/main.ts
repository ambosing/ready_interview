import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { config } from './config/index.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(config.port);
  console.log(`Backend server listening on http://localhost:${config.port}`);
}

bootstrap();

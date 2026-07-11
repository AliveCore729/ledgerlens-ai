import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import compression from "compression";
import { Logger } from 'nestjs-pino';

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://ledgerlens-ai-web.vercel.app",
      "https://shreyanshjain.site",
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[],
    credentials: true,
  });

  // Override helmet's default Cross-Origin-Opener-Policy so the
  // Google OAuth popup can communicate back to the parent window
  app.use(helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }));

  app.use(compression());

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;

  await app.listen(port);
  app.get(Logger).log(`🚀 API running on port ${port}`);
}

bootstrap();
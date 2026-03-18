import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global API prefix — all routes become /api/...
    app.setGlobalPrefix('api');

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS — allow localhost (dev) + production domains
    app.enableCors({
        origin: (origin, callback) => {
            const allowed = [
                /^http:\/\/localhost:\d+$/,
                /^https?:\/\/.*\.cloudwaysapps\.com$/,
                /^https?:\/\/adivinum\.cl$/,
                /^https?:\/\/.*\.adivinum\.cl$/,
            ];
            if (!origin || allowed.some((re) => re.test(origin))) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🎲 AdiviNum API running on http://localhost:${port}`);
}
bootstrap();

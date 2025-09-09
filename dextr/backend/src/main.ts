import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('DEX Backend API')
    .setDescription('Polkadot DEX Backend API with Oracle price feeds, Order matching, and Liquidity management')
    .setVersion('1.0')
    .addTag('dex', 'DEX system operations')
    .addTag('oracle', 'Oracle price feeds')
    .addTag('orders', 'Order management and orderbook')
    .addTag('liquidity', 'Liquidity pools and positions')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 8282);
}
bootstrap();

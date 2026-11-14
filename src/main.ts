import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configurarApp(app);

  const config = new DocumentBuilder()
    .setTitle('API de Productos')
    .setDescription(
      'CRUD de productos con PostgreSQL. POST validado con JSON Schema (ajv) - Semana 7, Integracion de Sistemas',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  const motivo = error instanceof Error ? error.message : String(error);
  new Logger('Bootstrap').error(`No se pudo arrancar la API: ${motivo}`);
  process.exit(1);
});

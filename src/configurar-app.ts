import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ErroresBaseDatosFilter } from './common/errores-base-datos.filter';

/**
 * Configuracion comun de la app, compartida por main.ts y las pruebas e2e,
 * para que las pruebas ejerciten exactamente lo que corre en produccion.
 */
export function configurarApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Valores fuera del rango de PostgreSQL (ids > int4, precios > numeric(10,2)) -> 400, no 500.
  app.useGlobalFilters(new ErroresBaseDatosFilter());

  // Sin X-Powered-By y con nosniff (fallo recurrente R11).
  const express = app.getHttpAdapter().getInstance() as {
    disable: (setting: string) => void;
  };
  express.disable('x-powered-by');
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
}

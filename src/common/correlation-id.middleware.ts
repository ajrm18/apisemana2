import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

// Semana 8: log de trazabilidad
// Registra metodo, URL y el X-Correlation-Id que agrega Kong (request-transformer).
// Si la peticion llega directo a la API, sin pasar por el Gateway, se ve "(sin header)".
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CorrelationId');

  use(req: Request, _res: Response, next: NextFunction): void {
    const correlationId = req.headers['x-correlation-id'] ?? '(sin header)';
    this.logger.log(`${req.method} ${req.originalUrl} X-Correlation-Id=${String(correlationId)}`);
    next();
  }
}

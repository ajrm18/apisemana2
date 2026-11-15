import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware (Semana 8)', () => {
  const middleware = new CorrelationIdMiddleware();
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => log.mockRestore());

  const ejecutar = (headers: Record<string, string>) => {
    const next = jest.fn() as unknown as NextFunction;
    const req = { method: 'GET', originalUrl: '/api/v1/productos/1', headers } as unknown as Request;
    middleware.use(req, {} as Response, next);
    return next;
  };

  it('registra el X-Correlation-Id que agrega Kong y continua', () => {
    const next = ejecutar({ 'x-correlation-id': 'kong-generado' });
    expect(log).toHaveBeenCalledWith('GET /api/v1/productos/1 X-Correlation-Id=kong-generado');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('registra "(sin header)" cuando la peticion no pasa por Kong', () => {
    const next = ejecutar({});
    expect(log).toHaveBeenCalledWith('GET /api/v1/productos/1 X-Correlation-Id=(sin header)');
    expect(next).toHaveBeenCalledTimes(1);
  });
});

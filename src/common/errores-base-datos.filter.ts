import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Codigos SQLSTATE de PostgreSQL causados por datos del cliente:
 * 22003 numeric_value_out_of_range (id > 2147483647, precio > numeric(10,2)),
 * 22P02 invalid_text_representation.
 */
const ERRORES_DEL_CLIENTE = new Set(['22003', '22P02']);

@Catch(QueryFailedError)
export class ErroresBaseDatosFilter implements ExceptionFilter {
  private readonly logger = new Logger('BaseDatos');

  catch(error: QueryFailedError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const codigo = (error.driverError as { code?: string } | undefined)?.code;

    if (codigo && ERRORES_DEL_CLIENTE.has(codigo)) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Valor fuera del rango permitido por la base de datos',
        error: 'Bad Request',
      });
      return;
    }

    // Una sola linea en el log, sin SQL ni parametros (fallo recurrente R20).
    this.logger.error(`QueryFailedError ${codigo ?? 'sin-codigo'}: ${error.message}`);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}

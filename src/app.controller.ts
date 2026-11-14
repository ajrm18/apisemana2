import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('salud')
@Controller('health')
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la API y de la conexion con PostgreSQL' })
  @ApiResponse({ status: 200, description: 'API y base de datos disponibles.' })
  @ApiResponse({ status: 503, description: 'La base de datos no responde.' })
  async salud() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({ status: 'error', baseDatos: 'desconectada' });
    }
    return { status: 'ok', baseDatos: 'conectada' };
  }
}

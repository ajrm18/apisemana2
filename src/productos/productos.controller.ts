import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarPrecioDto } from './dto/actualizar-precio.dto';
import { JsonSchemaValidationPipe } from '../common/json-schema-validation.pipe';
import producto from './schemas/producto.schema.v2.json';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos disponibles' })
  @ApiQuery({ name: 'nombre', required: false, description: 'Filtro opcional por nombre' })
  listar(@Query('nombre') nombre?: string) {
    return this.productosService.findAll(nombre);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un producto nuevo (validado con JSON Schema)' })
  @ApiBody({ schema: producto as object })
  @ApiResponse({ status: 201, description: 'Producto creado; header Location con su URI.' })
  @ApiResponse({ status: 400, description: 'El cuerpo no cumple el contrato JSON Schema.' })
  async crear(
    @Body(new JsonSchemaValidationPipe(producto)) body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const nuevo = await this.productosService.crear(body);
    res.setHeader('Location', `/api/v1/productos/${nuevo.id}`);
    return nuevo;
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reemplazar un producto completo' })
  async reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearProductoDto,
  ) {
    await this.productosService.reemplazar(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente el precio de un producto' })
  async actualizarPrecio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPrecioDto,
  ) {
    return this.productosService.actualizarPrecio(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    await this.productosService.eliminar(id);
  }
}
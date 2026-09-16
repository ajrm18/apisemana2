import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ProductosService } from './productos.service';
import type { Producto } from './productos.service';
import { ProductoDto } from './dto/producto.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarPrecioDto } from './dto/actualizar-precio.dto';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos disponibles' })
  @ApiOkResponse({
    description: 'Lista de productos devuelta correctamente.',
    type: ProductoDto,
    isArray: true,
  })
  findAll(): Producto[] {
    return this.productosService.findAll();
  }

    @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id (incluye enlaces HATEOAS)' })
  @ApiOkResponse({
    description: 'Producto encontrado con enlaces a acciones disponibles.',
    type: ProductoDto,
  })
  @ApiNotFoundResponse({
    description: 'Producto no encontrado.',
  })
  @ApiBadRequestResponse({
    description: 'El id enviado no es un numero valido.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    const producto = this.productosService.findOne(id);
    return {
      ...producto,
      _links: {
        self: { href: `/api/v1/productos/${producto.id}`, method: 'GET' },
        actualizar: { href: `/api/v1/productos/${producto.id}`, method: 'PUT' },
        actualizarPrecio: { href: `/api/v1/productos/${producto.id}`, method: 'PATCH' },
        eliminar: { href: `/api/v1/productos/${producto.id}`, method: 'DELETE' },
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un producto nuevo' })
  @ApiBody({ type: CrearProductoDto })
  @ApiCreatedResponse({
    description: 'Producto creado correctamente.',
    type: ProductoDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos en el body (nombre vacio o precio no positivo).',
  })
  crear(
    @Body() dto: CrearProductoDto,
    @Res({ passthrough: true }) res: Response,
  ): Producto {
    const nuevo = this.productosService.crear(dto);
    res.setHeader('Location', `/api/v1/productos/${nuevo.id}`);
    return nuevo;
  }
  @Put(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: 'Reemplazar un producto completo' })
@ApiParam({ name: 'id', type: Number, example: 1 })
@ApiBody({ type: CrearProductoDto })
@ApiNoContentResponse({ description: 'Producto reemplazado correctamente.' })
@ApiBadRequestResponse({ description: 'Datos invalidos en el body.' })
@ApiNotFoundResponse({ description: 'Producto no encontrado.' })
reemplazar(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: CrearProductoDto,
): void {
  this.productosService.reemplazar(id, dto);
}

@Patch(':id')
@ApiOperation({ summary: 'Actualizar parcialmente el precio de un producto' })
@ApiParam({ name: 'id', type: Number, example: 1 })
@ApiBody({ type: ActualizarPrecioDto })
@ApiOkResponse({ description: 'Producto actualizado correctamente.', type: ProductoDto })
@ApiBadRequestResponse({ description: 'Precio invalido.' })
@ApiNotFoundResponse({ description: 'Producto no encontrado.' })
actualizarPrecio(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: ActualizarPrecioDto,
): Producto {
  return this.productosService.actualizarPrecio(id, dto);
}
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: 'Eliminar un producto' })
@ApiParam({ name: 'id', type: Number, example: 2 })
@ApiNoContentResponse({ description: 'Producto eliminado correctamente.' })
@ApiNotFoundResponse({ description: 'Producto no encontrado.' })
eliminar(@Param('id', ParseIntPipe) id: number): void {
  this.productosService.eliminar(id);
}
}
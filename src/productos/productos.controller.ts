import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import type { Producto } from './productos.service';
import { ProductoDto } from './dto/producto.dto';

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
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiOkResponse({
    description: 'Producto encontrado.',
    type: ProductoDto,
  })
  @ApiNotFoundResponse({
    description: 'Producto no encontrado.',
  })
  @ApiBadRequestResponse({
    description: 'El id enviado no es un numero valido.',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Producto {
    return this.productosService.findOne(id);
  }
}
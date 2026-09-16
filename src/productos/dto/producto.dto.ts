import { ApiProperty } from '@nestjs/swagger';

export class ProductoDto {
  @ApiProperty({ example: 1, description: 'Identificador unico del producto' })
  id: number;

  @ApiProperty({ example: 'Teclado mecanico', description: 'Nombre del producto' })
  nombre: string;

  @ApiProperty({ example: 45.90, description: 'Precio del producto en dolares' })
  precio: number;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CrearProductoDto {
  @ApiProperty({ example: 'Audifonos', description: 'Nombre del producto' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 25.00, description: 'Precio del producto en dolares' })
  @IsNumber()
  @IsPositive()
  precio: number;
}
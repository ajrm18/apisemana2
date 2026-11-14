import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, MaxLength } from 'class-validator';

export class CrearProductoDto {
  @ApiProperty({ example: 'Audifonos', description: 'Nombre del producto', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: 25.00, description: 'Precio del producto en dolares', maximum: 99999999.99 })
  @IsNumber()
  @IsPositive()
  @Max(99999999.99)
  precio: number;
}

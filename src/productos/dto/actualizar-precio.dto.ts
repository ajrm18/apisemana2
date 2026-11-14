import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

export class ActualizarPrecioDto {
  @ApiProperty({ example: 60.00, description: 'Nuevo precio del producto en dolares', maximum: 99999999.99 })
  @IsNumber()
  @IsPositive()
  @Max(99999999.99)
  precio: number;
}

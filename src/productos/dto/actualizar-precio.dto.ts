import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class ActualizarPrecioDto {
  @ApiProperty({ example: 60.00, description: 'Nuevo precio del producto en dolares' })
  @IsNumber()
  @IsPositive()
  precio: number;
}
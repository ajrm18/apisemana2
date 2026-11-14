import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
// Desviacion 1: la clase por defecto de 'ajv' solo trae draft-07 y los esquemas
// declaran draft 2020-12; con 'ajv' a secas todos los POST devolvian 500.
import Ajv from 'ajv/dist/2020';
import type { ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

@Injectable()
export class JsonSchemaValidationPipe implements PipeTransform {
  // Desviacion 4: el esquema se compila una sola vez (la guia compilaba en cada peticion).
  private readonly validate: ValidateFunction;

  constructor(private schema: object) {
    this.validate = ajv.compile(this.schema);
  }

  transform(value: any) {
    const valido = this.validate(value);
    if (!valido) {
      throw new BadRequestException({
        mensaje: 'El cuerpo de la peticion no cumple el contrato JSON Schema',
        errores: this.validate.errors,
      });
    }
    return value;
  }
}

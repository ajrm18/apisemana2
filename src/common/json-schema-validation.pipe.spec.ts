import { BadRequestException } from '@nestjs/common';
import { JsonSchemaValidationPipe } from './json-schema-validation.pipe';
import productoV1 from '../productos/schemas/producto.schema.json';
import productoV2 from '../productos/schemas/producto.schema.v2.json';
import productoV3 from '../productos/schemas/producto.schema.v3-breaking.json';

/** Ejecuta el pipe y devuelve los `keyword` de ajv del error 400 (o [] si pasa). */
function keywords(pipe: JsonSchemaValidationPipe, body: unknown): string[] {
  try {
    pipe.transform(body);
    return [];
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    const resp = (e as BadRequestException).getResponse() as {
      mensaje: string;
      errores: { keyword: string }[];
    };
    expect(resp.mensaje).toBe('El cuerpo de la peticion no cumple el contrato JSON Schema');
    return resp.errores.map((err) => err.keyword);
  }
}

describe('JsonSchemaValidationPipe (esquema v1)', () => {
  const pipe = new JsonSchemaValidationPipe(productoV1);

  it('deja pasar un cuerpo valido sin modificarlo', () => {
    const body = { nombre: 'Auriculares', precio: 10 };
    expect(pipe.transform(body)).toBe(body);
  });

  it('rechaza la falta de precio con required (missingProperty: precio)', () => {
    expect(() => pipe.transform({ nombre: 'Auriculares' })).toThrow(BadRequestException);
    try {
      pipe.transform({ nombre: 'Auriculares' });
    } catch (e) {
      const resp = (e as BadRequestException).getResponse() as {
        errores: { keyword: string; params: Record<string, unknown> }[];
      };
      expect(resp.errores[0]).toMatchObject({
        keyword: 'required',
        params: { missingProperty: 'precio' },
      });
    }
  });

  it('rechaza un campo no declarado (stock) con additionalProperties', () => {
    expect(keywords(pipe, { nombre: 'Auriculares', precio: 10, stock: 5 })).toEqual([
      'additionalProperties',
    ]);
  });

  it('rechaza precio negativo con minimum', () => {
    expect(keywords(pipe, { nombre: 'Auriculares', precio: -1 })).toEqual(['minimum']);
  });

  it('rechaza nombre vacio con minLength', () => {
    expect(keywords(pipe, { nombre: '', precio: 10 })).toEqual(['minLength']);
  });

  it('rechaza nombre de mas de 120 caracteres con maxLength', () => {
    expect(keywords(pipe, { nombre: 'x'.repeat(121), precio: 10 })).toEqual(['maxLength']);
  });

  it('rechaza un precio que no cabe en numeric(10,2) con maximum', () => {
    expect(keywords(pipe, { nombre: 'Caro', precio: 100000000 })).toEqual(['maximum']);
    expect(pipe.transform({ nombre: 'Tope', precio: 99999999.99 })).toBeDefined();
  });

  it('rechaza tipos incorrectos con type', () => {
    expect(keywords(pipe, { nombre: 'Auriculares', precio: '10' })).toEqual(['type']);
  });

  it('reporta todos los errores a la vez (allErrors)', () => {
    expect(keywords(pipe, { stock: 1 }).sort()).toEqual(
      ['additionalProperties', 'required', 'required'].sort(),
    );
  });
});

describe('JsonSchemaValidationPipe (esquema v2)', () => {
  const pipe = new JsonSchemaValidationPipe(productoV2);

  it('acepta una peticion con formato v1 (sin categoria)', () => {
    expect(keywords(pipe, { nombre: 'Auriculares', precio: 10 })).toEqual([]);
  });

  it('acepta categoria "electronica"', () => {
    expect(keywords(pipe, { nombre: 'Laptop', precio: 899.99, categoria: 'electronica' })).toEqual(
      [],
    );
  });

  it('rechaza categoria "juguetes" con enum', () => {
    expect(keywords(pipe, { nombre: 'Pelota', precio: 5, categoria: 'juguetes' })).toEqual([
      'enum',
    ]);
  });
});

describe('JsonSchemaValidationPipe (esquema v3-breaking)', () => {
  const pipe = new JsonSchemaValidationPipe(productoV3);

  it('rechaza una peticion v1 porque categoria es requerida', () => {
    expect(keywords(pipe, { nombre: 'Auriculares', precio: 10 })).toEqual(['required']);
  });
});

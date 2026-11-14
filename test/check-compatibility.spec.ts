import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import v1 from '../src/productos/schemas/producto.schema.json';
import v2 from '../src/productos/schemas/producto.schema.v2.json';
import v3 from '../src/productos/schemas/producto.schema.v3-breaking.json';

interface Resultado {
  compatible: boolean;
  problemas: string[];
}
type Schema = { required?: string[]; properties?: Record<string, Record<string, unknown>> };

// check-compatibility.js es CommonJS (se usa por CLI); se carga con require.
const { esCompatibleBackward } = require('../check-compatibility.js') as {
  esCompatibleBackward: (viejo: Schema, nuevo: Schema) => Resultado;
};

const base: Schema = {
  required: ['nombre', 'precio'],
  properties: { nombre: { type: 'string' }, precio: { type: 'number' } },
};

describe('esCompatibleBackward (casos de la guia)', () => {
  it('v1 -> v2 es compatible (categoria opcional)', () => {
    expect(esCompatibleBackward(v1, v2)).toEqual({ compatible: true, problemas: [] });
  });

  it('v2 -> v3-breaking NO es compatible (categoria pasa a requerida sin default)', () => {
    expect(esCompatibleBackward(v2, v3)).toEqual({
      compatible: false,
      problemas: ['Campo requerido nuevo sin default: categoria'],
    });
  });

  it('v1 -> v3-breaking NO es compatible', () => {
    expect(esCompatibleBackward(v1, v3).compatible).toBe(false);
  });
});

describe('esCompatibleBackward (casos adicionales)', () => {
  it('detecta un campo eliminado', () => {
    const nuevo: Schema = { required: ['nombre'], properties: { nombre: { type: 'string' } } };
    expect(esCompatibleBackward(base, nuevo)).toEqual({
      compatible: false,
      problemas: ['Campo eliminado: precio'],
    });
  });

  it('detecta un tipo cambiado', () => {
    const nuevo: Schema = {
      required: ['nombre', 'precio'],
      properties: { nombre: { type: 'string' }, precio: { type: 'string' } },
    };
    expect(esCompatibleBackward(base, nuevo)).toEqual({
      compatible: false,
      problemas: ['Tipo cambiado en precio: number -> string'],
    });
  });

  it('un requerido nuevo CON default es compatible', () => {
    const nuevo: Schema = {
      required: ['nombre', 'precio', 'moneda'],
      properties: { ...base.properties, moneda: { type: 'string', default: 'USD' } },
    };
    expect(esCompatibleBackward(base, nuevo)).toEqual({ compatible: true, problemas: [] });
  });

  it('un requerido nuevo que no existia antes y sin default es breaking', () => {
    const nuevo: Schema = {
      required: ['nombre', 'precio', 'sku'],
      properties: { ...base.properties, sku: { type: 'string' } },
    };
    expect(esCompatibleBackward(base, nuevo).problemas).toEqual([
      'Campo requerido nuevo sin default: sku',
    ]);
  });

  it('esquemas sin required ni properties no fallan', () => {
    expect(esCompatibleBackward({}, {})).toEqual({ compatible: true, problemas: [] });
  });
});

describe('check-compatibility.js por CLI', () => {
  const raiz = join(__dirname, '..');
  const esquemas = join(raiz, 'src', 'productos', 'schemas');
  const cli = (a: string, b: string): Resultado =>
    JSON.parse(
      execFileSync(process.execPath, [
        join(raiz, 'check-compatibility.js'),
        join(esquemas, a),
        join(esquemas, b),
      ]).toString(),
    ) as Resultado;

  it('imprime compatible: false para v2 -> v3-breaking', () => {
    expect(cli('producto.schema.v2.json', 'producto.schema.v3-breaking.json').compatible).toBe(
      false,
    );
  });

  it('imprime compatible: true para v1 -> v2', () => {
    expect(cli('producto.schema.json', 'producto.schema.v2.json').compatible).toBe(true);
  });
});

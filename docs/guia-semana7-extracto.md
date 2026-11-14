# Extracto de la guía · Semana 7 · Contratos y Validación con JSON Schema

Texto de referencia de la guía oficial (Integración de Sistemas, PUCE), tal como lo entregó el estudiante. Las desviaciones aplicadas están en `README.md`, sección "Desviaciones respecto a la guía".

## Paso 0

`node --version` (18+), `npm --version`; abrir `nestjs-productos-api` y `npm install`. Verificación: el proyecto arranca con `npm run start:dev`.

## Paso 1

`npm install ajv ajv-formats`. Verificación: ambos paquetes en `package.json`.

## Paso 2

Crear `src/productos/schemas/producto.schema.json` ANTES de tocar el controlador:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Producto",
  "type": "object",
  "required": ["nombre", "precio"],
  "properties": {
    "nombre": { "type": "string", "minLength": 1, "maxLength": 120 },
    "precio": { "type": "number", "minimum": 0 }
  },
  "additionalProperties": false
}
```

Recuadro "Piensa": "Este archivo es tu contrato explícito — vive de forma completamente independiente del código TypeScript del controlador. ¿Qué otras restricciones reales tiene tu dominio de Productos?"

## Paso 3

Crear `src/common/json-schema-validation.pipe.ts`:

```ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

@Injectable()
export class JsonSchemaValidationPipe implements PipeTransform {
  constructor(private schema: object) {}

  transform(value: any) {
    const validate = ajv.compile(this.schema);
    const valido = validate(value);
    if (!valido) {
      throw new BadRequestException({
        mensaje: 'El cuerpo de la peticion no cumple el contrato JSON Schema',
        errores: validate.errors,
      });
    }
    return value;
  }
}
```

Aplicarlo en `POST /productos`:

```ts
import producto from './schemas/producto.schema.json';

@Post()
crear(@Body(new JsonSchemaValidationPipe(producto)) body: any) {
  // ... tu logica existente
}
```

## Paso 4

POST sin `precio` (`{"nombre":"Auriculares"}`) → 400; POST con campo no declarado (`{"nombre":"Auriculares","precio":10,"stock":5}`) → 400.

## Paso 5

Crear `producto.schema.v2.json` copiando v1 y agregando, como opcional:

```json
"categoria": { "type": "string", "enum": ["electronica", "oficina", "hogar"] }
```

(`required` sigue siendo `["nombre", "precio"]` y `additionalProperties: false`). Cambiar el import del controlador a v2 y enviar la petición vieja del Paso 4. Verificación: sin `categoria` es aceptada; con `categoria: "electronica"` también.

## Paso 6 (reto)

Crear `producto.schema.v3-breaking.json` = v2 con `categoria` en `required`. Crear `check-compatibility.js` en la raíz:

```js
const fs = require('fs');

function esCompatibleBackward(schemaViejo, schemaNuevo) {
  const problemas = [];
  const reqNuevo = new Set(schemaNuevo.required || []);
  const reqViejo = new Set(schemaViejo.required || []);

  for (const campo of reqNuevo) {
    if (!reqViejo.has(campo) && !(campo in (schemaViejo.properties || {}))) {
      problemas.push(`Campo requerido nuevo sin default: ${campo}`);
    }
  }
  for (const campo of Object.keys(schemaViejo.properties || {})) {
    if (!(campo in (schemaNuevo.properties || {}))) {
      problemas.push(`Campo eliminado: ${campo}`);
    }
  }
  for (const campo of Object.keys(schemaViejo.properties || {})) {
    const tViejo = schemaViejo.properties[campo]?.type;
    const tNuevo = schemaNuevo.properties?.[campo]?.type;
    if (tNuevo && tViejo !== tNuevo) {
      problemas.push(`Tipo cambiado en ${campo}: ${tViejo} -> ${tNuevo}`);
    }
  }
  return { compatible: problemas.length === 0, problemas };
}

const viejo = JSON.parse(fs.readFileSync(process.argv[2]));
const nuevo = JSON.parse(fs.readFileSync(process.argv[3]));
console.log(JSON.stringify(esCompatibleBackward(viejo, nuevo), null, 2));
```

Ejecutar `node check-compatibility.js src/productos/schemas/producto.schema.v2.json src/productos/schemas/producto.schema.v3-breaking.json` y también v1 → v2. Verificación: v2→v3 `compatible: false` con el mensaje sobre `categoria`; v1→v2 `compatible: true`.

## Paso 7 (bitácora)

1. ¿Cuál de los tres (JSON Schema con ajv, DTOs con class-validator de la Semana 2, contrato .proto de la Semana 3) se sintió más "contrato explícito", y por qué?
2. ¿En qué escenario preferirías class-validator sobre JSON Schema, y viceversa?
3. Si tu equipo tuviera 5 consumidores externos de esta API, ¿usarías la política BACKWARD o FULL para versionar este esquema? Justifica.

## Paso 8

`git add .` y `git commit -m "feat: validacion schema-first con ajv + chequeo de compatibilidad (Semana 7)"`. Declaración de uso de IA con este formato:

```
### Declaración de uso de IA
- Herramienta(s):
- Nivel de uso:
- Qué se le pidió:
- Qué se modificó/verificó manualmente:
```

Uso de IA permitido: interpretar errores de ajv, revisar restricciones faltantes del esquema y generar casos de prueba para el script del Paso 6. No permitido: aceptar la clasificación de compatibilidad sin ejecutar el script real, y fusionar v1 y v2 en un solo archivo.

## Checklist de salida

- Los 3 esquemas existen y son JSON válidos.
- El pipe rechaza peticiones inválidas.
- Una petición v1 sigue siendo válida contra v2.
- El script detecta ambos casos.
- Las 3 preguntas en la bitácora.
- Commit del proyecto.

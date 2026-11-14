# API Productos (NestJS + PostgreSQL)

API de productos construida con NestJS, persistida en PostgreSQL con TypeORM y documentada con Swagger/OpenAPI. Proyecto que se ha ido continuando de la Semana 1 a la Semana 7.

- **Curso:** Integración de Sistemas - PUCE
- **Autor:** Anthony Rosero (trabajo individual)
- **Última actualización:** 14/11/2026 (Semana 7 · Práctica 8)

## Links públicos

| Recurso | URL |
|---|---|
| Repositorio | https://github.com/ajrm18/apisemana2 |
| API (listado) | https://apisemana2.onrender.com/api/v1/productos |
| Salud (API + base) | https://apisemana2.onrender.com/api/v1/health |
| Swagger UI | https://apisemana2.onrender.com/api/docs |

> **Render gratis duerme el servicio tras 15 min sin tráfico.** Antes de una demo hay que abrir `/api/v1/health` y esperar hasta 1 minuto a que responda `{"status":"ok","baseDatos":"conectada"}`.

## Cómo ejecutar en local

Requisitos: Node.js 24 o superior (`engines`), Docker Desktop y el contenedor `pg-productos` (PostgreSQL 16 en el puerto **5433**; el 5432 lo ocupa un PostgreSQL 18 nativo).

```powershell
docker start pg-productos
copy .env.example .env      # y ajustar DATABASE_URL
npm ci
npm run start:dev
```

- API: http://localhost:3000/api/v1/productos
- Salud: http://localhost:3000/api/v1/health
- Swagger UI: http://localhost:3000/api/docs

### Variables de entorno

| Variable | Obligatoria | Uso |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL. Si falta, la API no arranca y lo dice (`Falta la variable de entorno DATABASE_URL`). En local: `postgresql://postgres:postgres@localhost:5433/productos_db`. En Render se define en *Environment*; nunca se versiona. |
| `NODE_ENV` | No | `production` en Render: activa SSL hacia la base y desactiva `synchronize` (el esquema se aplica con la migración). |
| `DB_SSL` | No | `true` fuerza SSL fuera de producción. |
| `PORT` | No | Puerto HTTP (por defecto 3000; Render lo inyecta). |

### Scripts

| Script | Qué hace |
|---|---|
| `npm run build` | Compila a `dist/` (incluye `dist/productos/schemas/*.json`) |
| `npm run lint` | `oxlint --type-aware --deny-warnings` sobre `src/` y `test/` |
| `npm test` | 23 pruebas unitarias (pipe JSON Schema y script de compatibilidad); falla si no hay specs |
| `npm run test:e2e` | 13 pruebas e2e contra un PostgreSQL real (usa `DATABASE_URL`) |
| `npm run check:compat -- <viejo.json> <nuevo.json>` | Chequeo de compatibilidad BACKWARD entre dos esquemas |
| `.\scripts\verificar-contrato.ps1 [-BaseUrl URL]` / `bash scripts/verificar-contrato.sh [URL]` | Verificación del contrato (local o nube) con tabla PASS/FAIL |

## Endpoints implementados

| Método | Ruta | Validación del cuerpo | Descripción |
|---|---|---|---|
| GET | /api/v1/health | - | Estado de la API y de la base (200 o 503) |
| GET | /api/v1/productos | - | Lista los productos ordenados por id (filtro opcional `?nombre=`) |
| GET | /api/v1/productos/{id} | - | Obtiene un producto (404 si no existe, 400 si el id no es válido o no cabe en `integer`) |
| POST | /api/v1/productos | **JSON Schema v2 (ajv)** | Crea un producto; 201 con header `Location` |
| PUT | /api/v1/productos/{id} | DTO `CrearProductoDto` (class-validator) | Reemplaza un producto completo (204) |
| PATCH | /api/v1/productos/{id} | DTO `ActualizarPrecioDto` (class-validator) | Actualiza el precio (200) |
| DELETE | /api/v1/productos/{id} | - | Elimina un producto (204; 404 si ya no existe) |

---

## Semana 7 · Práctica 8: Contratos y validación con JSON Schema

### Qué es schema-first y dónde vive el contrato

En **schema-first** el contrato se escribe primero, como un archivo independiente del código, y luego el código se obliga a cumplirlo. Aquí el contrato de `Producto` es un JSON Schema (draft 2020-12) en `src/productos/schemas/`. El esquema v1 se commiteó solo (`fe847d0`) antes de tocar el controlador. Un `JsonSchemaValidationPipe` propio, basado en **ajv**, valida el cuerpo de `POST /api/v1/productos` contra ese archivo. Los esquemas también los lee `check-compatibility.js`, sin cargar NestJS ni TypeScript.

| Archivo | Qué cambia | ¿Compatible (BACKWARD) con la versión anterior? | ¿Lo usa el controlador? |
|---|---|---|---|
| `producto.schema.json` (v1) | `nombre` (1-120 caracteres) y `precio` (0 a 99 999 999,99) requeridos; `additionalProperties: false` | - | No |
| `producto.schema.v2.json` | + `categoria` **opcional** con `enum` `electronica`, `oficina` y `hogar` | **Sí**: `compatible: true`; una petición v1 recibe 201 | **Sí** (entrega final) |
| `producto.schema.v3-breaking.json` | `categoria` pasa a **requerida** sin `default` | **No**: `compatible: false` ("Campo requerido nuevo sin default: categoria"); una petición v1 recibe 400 | No (solo se probó temporalmente) |

Los tres son archivos separados. No se fusionaron, porque la guía lo prohíbe.

### Flujo de validación

```mermaid
flowchart LR
    C[Cliente] -->|POST /api/v1/productos| G["ValidationPipe global (class-validator)"]
    G -->|"body: any (metatipo Object): no valida ni transforma"| J["JsonSchemaValidationPipe (ajv 2020-12, esquema v2 compilado una vez)"]
    J -->|cumple el contrato| K["ProductosController.crear → ProductosService.crear"]
    K --> DB[(PostgreSQL)]
    K -->|"201 + Location: /api/v1/productos/{id}"| C
    J -->|"no cumple"| E["400 {mensaje, errores[] de ajv}"]
    E --> C
    C2[Cliente] -->|PUT / PATCH| G2["ValidationPipe global + DTO"]
    G2 -->|inválido| E2["400 {message[]}"]
    G2 -->|válido| K2[Controlador]
```

### Evolución del esquema

```mermaid
flowchart LR
    V1["v1: nombre, precio (required)"] -->|"+ categoria opcional (enum)"| V2["v2"]
    V2 -->|"categoria pasa a required, sin default"| V3["v3-breaking"]
    V1 -. "check-compatibility: compatible: true" .-> OK(("Compatible"))
    V2 -. "check-compatibility: compatible: false" .-> KO(("Breaking"))
    style OK fill:#d4edda,stroke:#28a745
    style KO fill:#f8d7da,stroke:#dc3545
```

### Comparación de enfoques de contrato (solo hechos)

| Aspecto | `class-validator` (Semana 2) | JSON Schema + ajv (Semana 7) | `.proto` (Semana 3) |
|---|---|---|---|
| Dónde viven las reglas | Decoradores en clases TypeScript (`src/productos/dto/*.dto.ts`) | Archivos `.json` independientes (`src/productos/schemas/`) | Archivo `.proto` independiente (proyecto `nestjs-productos-grpc`) |
| Cuándo se validan | En tiempo de ejecución, en cada petición, por el `ValidationPipe` global (PUT y PATCH) | En tiempo de ejecución, en cada petición, por `JsonSchemaValidationPipe` (POST); el esquema se compila una vez al crear el pipe | Los tipos de los mensajes se fijan en el `.proto` y se aplican al serializar y deserializar con Protocol Buffers |
| Formato del error | `{"message": ["property stock should not exist"], ...}` | `{"mensaje": ..., "errores": [{keyword, instancePath, schemaPath, params, message}]}` | Estado gRPC (por ejemplo, `INVALID_ARGUMENT`) |
| ¿Sirve para otros lenguajes? | No: depende de TypeScript y de la librería | Sí: el estándar JSON Schema tiene validadores en muchos lenguajes, y el script de compatibilidad lo lee como JSON | Sí: `protoc` genera código para muchos lenguajes |
| Chequeo de compatibilidad | No hay herramienta en este proyecto | `check-compatibility.js` (BACKWARD) | No se hizo en la Semana 3 |

### Ejemplos (PowerShell)

En PowerShell `curl` es alias de `Invoke-WebRequest`, así que se usa `curl.exe` o `Invoke-RestMethod`. Para no pelear con el escape de comillas, el cuerpo se pasa desde un archivo o desde una variable:

```powershell
$API = 'http://localhost:3000/api/v1/productos'   # o https://apisemana2.onrender.com/api/v1/productos

# 400: falta precio (con curl.exe se ve el código y el cuerpo del error)
'{"nombre":"Auriculares"}' | Out-File -Encoding ascii body.json
curl.exe -i -X POST $API -H "Content-Type: application/json" --data-binary "@body.json"

# 400: campo no declarado
'{"nombre":"Auriculares","precio":10,"stock":5}' | Out-File -Encoding ascii body.json
curl.exe -i -X POST $API -H "Content-Type: application/json" --data-binary "@body.json"

# 201: formato v1, válido contra v2
Invoke-RestMethod -Method Post -Uri $API -ContentType 'application/json' -Body '{"nombre":"Auriculares","precio":10}'

# 201 con categoria / 400 con categoria fuera del enum (cuerpo del error desde ErrorDetails)
Invoke-RestMethod -Method Post -Uri $API -ContentType 'application/json' -Body '{"nombre":"Laptop","precio":899.99,"categoria":"electronica"}'
try { Invoke-RestMethod -Method Post -Uri $API -ContentType 'application/json' -Body '{"nombre":"Pelota","precio":5,"categoria":"juguetes"}' }
catch { "HTTP $([int]$_.Exception.Response.StatusCode)"; $_.ErrorDetails.Message }

# Compatibilidad
npm run check:compat -- src/productos/schemas/producto.schema.v2.json src/productos/schemas/producto.schema.v3-breaking.json
npm run check:compat -- src/productos/schemas/producto.schema.json src/productos/schemas/producto.schema.v2.json

# Verificación completa (local y nube)
.\scripts\verificar-contrato.ps1
.\scripts\verificar-contrato.ps1 -BaseUrl https://apisemana2.onrender.com
```

Respuesta 400 real (POST sin `precio`):

```json
{"mensaje":"El cuerpo de la peticion no cumple el contrato JSON Schema","errores":[{"instancePath":"","schemaPath":"#/required","keyword":"required","params":{"missingProperty":"precio"},"message":"must have required property 'precio'"}]}
```

Evidencias: `docs/evidencia-local.txt`, `docs/evidencia-script-original.txt`, `docs/evidencia-script.txt` y `docs/evidencia-nube.txt`. Extracto de la guía: `docs/guia-semana7-extracto.md`.

### Desviaciones respecto a la guía

| # | Desviación | Motivo | Evidencia (antes → después) |
|---|---|---|---|
| 1 | `import Ajv from 'ajv/dist/2020'` en lugar de `'ajv'` (`src/common/json-schema-validation.pipe.ts:4`) | La clase por defecto de ajv solo trae draft-07 y los esquemas declaran `"$schema": ".../draft/2020-12/schema"` (que no se cambió) | Antes: `Error: no schema with key or ref "https://json-schema.org/draft/2020-12/schema"` y **todos** los POST respondían 500. Después: `OK: esquema draft 2020-12 compilado` y 400/201 correctos (`docs/evidencia-local.txt`) |
| 2 | En `check-compatibility.js`, la regla de "requerido nuevo" pasa a ser `!reqViejo.has(campo) && schemaNuevo.properties?.[campo]?.default === undefined` | La condición de la guía exige que el campo no exista en el esquema viejo; en v2 `categoria` ya existía como opcional, así que v2 → v3-breaking salía compatible. Se mantuvieron el mensaje y las otras dos reglas | Antes: `{"compatible": true, "problemas": []}` (`docs/evidencia-script-original.txt`). Después: `{"compatible": false, "problemas": ["Campo requerido nuevo sin default: categoria"]}` (`docs/evidencia-script.txt`) |
| 3 | `"resolveJsonModule": true` en `tsconfig.json` | Necesario para `import producto from './schemas/producto.schema.v2.json'` | `npm run build` compila y copia el esquema importado a `dist/productos/schemas/producto.schema.v2.json` |
| 4 | `ajv.compile()` se movió al constructor del pipe (`private readonly validate`) | La guía compilaba el esquema en cada petición; el comportamiento es el mismo | 15 pruebas del pipe en verde (`src/common/json-schema-validation.pipe.spec.ts`) |
| 5 | Rutas con el prefijo `api/v1` | El proyecto usa `setGlobalPrefix('api/v1')` desde la Semana 1 | `POST http://localhost:3000/api/v1/productos` |
| 6 | Ejemplos con `curl.exe` / `Invoke-RestMethod` y lectura del cuerpo del 400 | En PowerShell `curl` es `Invoke-WebRequest` y los `\"` de la guía no funcionan | `scripts/verificar-contrato.ps1` (lee `ErrorDetails.Message`) |
| 7 | `@Body(new JsonSchemaValidationPipe(producto)) body: any` solo en POST; PUT y PATCH siguen con DTOs | Lo pide la guía. El `ValidationPipe` global no interfiere porque el metatipo es `Object`: el 400 con `stock` lo emite ajv (`additionalProperties`), no el whitelist | Prueba e2e "campo stock → 400 del pipe ajv" y "PUT con campo extra → 400 del ValidationPipe". **Hoy conviven dos fuentes de verdad** (ver más abajo) |
| 8 | Columna `@Column({ nullable: true }) categoria?: string` y `categoria` en `ProductosService.crear` | La entidad no tenía la columna y v2 la acepta; es nullable para que los registros viejos sigan siendo válidos | `\d productos` → `categoria character varying` (nullable); `Location` y 201 iguales; la respuesta incluye `"categoria": null` cuando no se envía |
| 9 | `@ApiBody({ schema: producto })` en el POST | Con `body: any`, Swagger no mostraba ningún cuerpo | Swagger (`/api/docs`) muestra el contrato v2 y permite probarlo |
| 10 | Pruebas reales y `npm test` sin `--passWithNoTests` | El CI ejecutaba 0 pruebas | 23 unitarias + 13 e2e; `esCompatibleBackward` exportado con `module.exports` y CLI con `require.main === module` |
| 11 | `"maximum": 99999999.99` en `precio` en los 3 esquemas | Restricción real del dominio (recuadro "Piensa" del Paso 2): la columna es `numeric(10,2)` y un precio mayor producía 500 | `{"nombre":"X","precio":100000000}` → 400 `maximum` (antes, 500 por desbordamiento numérico) |
| 12 | Prevención de fallos de auditorías anteriores (fuera de la guía) | Pedido explícito del estudiante | Ver la tabla siguiente |

**Dos fuentes de verdad:** POST se valida con el JSON Schema v2 y PUT/PATCH con `class-validator`. Las reglas se alinearon donde se pudo (`@MaxLength(120)` y `@Max(99999999.99)` en los DTOs), pero siguen siendo distintas: el DTO usa `@IsPositive()` (rechaza 0) y el esquema usa `minimum: 0` (acepta 0), y el DTO de PUT no acepta `categoria`.

### Prevención de fallos recurrentes (auditorías P1 a P7)

| Fallo recurrente | Cómo se previene aquí |
|---|---|
| R01 lint falla por `bootstrap()` sin manejar | `bootstrap().catch(...)` con mensaje de una línea y `process.exit(1)` (`src/main.ts`); lint con `--deny-warnings` en el CI |
| R02 sin pruebas / `--passWithNoTests` | 23 unitarias + 13 e2e; sin `--passWithNoTests` |
| R03 CI sin lint ni pruebas reales | `.github/workflows/tests.yml`: `npm ci`, lint, build, test, e2e con el servicio postgres y chequeo de compatibilidad |
| R05 dependencias ocultas por `Downloads\1\node_modules` | `npm ci` en un clon limpio y en `ubuntu-24.04`; `ajv` y `ajv-formats` en `dependencies` |
| R06 entradas inválidas que dan 500 | JSON Schema + DTOs; filtro `ErroresBaseDatosFilter`: ids > 2147483647 y valores fuera de rango → 400 |
| R10 sin endpoint de salud | `GET /api/v1/health` con `SELECT 1` (200 / 503) |
| R11 `X-Powered-By` | Desactivado; `X-Content-Type-Options: nosniff` (`src/configurar-app.ts`) |
| R12 "Hello World!" de la plantilla | Eliminado (`app.service.ts` borrado) |
| R14 versiones de Node desalineadas | `engines.node >=24`, Node 24 en el CI |
| R15 acciones deprecadas / `ubuntu-latest` | `actions/checkout@v5`, `actions/setup-node@v5`, `ubuntu-24.04` |
| R16 vulnerabilidades por dependencias sin uso | Se quitaron `@nestjs/mau`, `@nestjs/observe` y el script `deploy`; `npm audit --omit=dev` en 0 |
| R17 secretos / URLs fijas | `DATABASE_URL` solo por entorno, con error claro si falta; `.env` ignorado |
| R18 `synchronize: true` en producción | `synchronize: NODE_ENV !== 'production'` + migración idempotente `src/migrations/1763150000000-ProductosCategoria.ts` (`migrationsRun: true`) |
| R19 documentación desactualizada | Este README (sin marcadores, links reales) y `BITACORA.md` |
| R20 logs ruidosos | Los errores de base no previstos se registran en una línea, sin SQL ni parámetros |

### Checklist de salida de la guía

- [x] Los 3 esquemas existen y son JSON válidos: `src/productos/schemas/producto.schema.json`, `.v2.json` y `.v3-breaking.json` (`JSON.parse` OK; también los compila ajv en las pruebas).
- [x] El pipe rechaza peticiones inválidas: 400 con `required`, `additionalProperties`, `minimum` y `enum` (`docs/evidencia-local.txt`, PASS 9/9).
- [x] Una petición v1 sigue siendo válida contra v2: `{"nombre":"Auriculares","precio":10}` → 201.
- [x] El script detecta ambos casos: v1 → v2 `compatible: true`; v2 → v3-breaking `compatible: false` (`docs/evidencia-script.txt`).
- [x] Las 3 preguntas en la bitácora: `BITACORA.md`, "Preguntas de cierre (Paso 7)". **Las respuestas las escribe el estudiante.**
- [x] Commit del proyecto con el mensaje de la guía: `feat: validacion schema-first con ajv + chequeo de compatibilidad (Semana 7)`.

### Declaración de uso de IA

- Herramienta(s): Claude Code (Anthropic).
- Nivel de uso: alto (implementación a partir de la guía, corrección de errores de la guía, pruebas, despliegue y auditoría).
- Qué se le pidió: implementar los Pasos 0 a 8 de la guía sobre este proyecto (esquemas v1, v2 y v3-breaking, `JsonSchemaValidationPipe` con ajv, script de compatibilidad); diagnosticar y corregir los dos errores de la guía (ajv con draft 2020-12 y el script que no detectaba el breaking change), ejecutando primero el script original; generar los casos de prueba del pipe y del script; prevenir los fallos recurrentes de las auditorías anteriores; escribir los scripts de verificación, el README y la bitácora (sin responder las preguntas del Paso 7); desplegar en Render y auditar la entrega.
- Qué se modificó/verificó manualmente:
  -
  -
  -

---

## Semanas anteriores

## Bitacora de reflexion

### Reflexion 1 (Paso 1): Automatizacion

El CLI de NestJS es una herramienta de automatizacion porque genera
codigo a partir de convenciones en lugar de escribirlo a mano. Otras
herramientas de automatizacion vistas en la teoria: contenedores
Docker (empaquetado y ejecucion reproducible), pipelines CI/CD
(build y despliegue automatizado), generadores basados en contratos
OpenAPI (Swagger Codegen), e infraestructura como codigo (Terraform).

### Reflexion 2 (Paso 5): Desacoplar por contrato

NestJS separa el controlador del servicio para desacoplar la interfaz
publica de la implementacion interna. El controlador define el
contrato HTTP hacia afuera (rutas, verbos, respuestas). El servicio
contiene la logica de negocio y puede cambiar de implementacion
(array en memoria hoy, PostgreSQL manana, otro microservicio pasado
manana) sin romper a los consumidores de la API. Esta separacion es
la version a nivel de clase del principio de responsabilidad unica
que en microservicios se aplica a nivel de despliegue.

### Reflexion 3 (Paso 8): Que le falta a Swagger para uso externo

Antes de agregar los DTOs, Swagger mostraba solo el codigo de estado
y una descripcion textual de la respuesta, pero no la forma exacta
del JSON devuelto. Un equipo frontend tenia que adivinar o leer el
codigo del servicio para saber que campos esperar. Al introducir
ProductoDto con decoradores @ApiProperty (ejemplos y descripciones),
Swagger genera el esquema completo y ejemplos de respuesta. Ahora
el contrato es autosuficiente: el equipo consumidor puede trabajar
solo con /api/docs sin ver el codigo backend.

---

## Semana 2 - CRUD completo, URIs y codigos de estado

Esta semana se completo el CRUD sobre la base de Semana 1:
POST (crear con validacion via DTO), PUT (reemplazar completo),
PATCH (actualizar parcial de precio), DELETE (eliminar idempotente)
y enlaces HATEOAS en el GET por id.

### Reflexion 4 (Paso 4): Validacion declarativa vs imperativa

En vez de escribir `if (!dto.nombre) throw new BadRequestException(...)`
en el controlador, se declaran las reglas con decoradores en el DTO
(`@IsString`, `@IsNotEmpty`, `@IsNumber`, `@IsPositive`) y el
ValidationPipe global las aplica automaticamente. Esto separa la
regla ("el nombre no puede estar vacio") del mecanismo ("cuando
llegue un request, chequea"). Ventajas: menos codigo repetido, las
reglas viven junto al modelo, y Swagger las lee para documentar
respuestas 400 sin trabajo extra.

### Reflexion 5 (Paso 5): Diferencia entre PUT y PATCH

PUT reemplaza el recurso completo: exige enviar el objeto entero
(nombre + precio) y responde 204 No Content porque el cliente ya
tiene todos los datos que envio. Es idempotente: llamarlo N veces
con el mismo body deja el recurso identico.

PATCH actualiza parcialmente: solo envia los campos que cambian
(aqui solo precio) y responde 200 OK con el recurso actualizado,
porque el cliente necesita ver el estado final combinado con los
campos que no toco. Tambien es idempotente cuando se aplica al
mismo campo con el mismo valor, pero tiene menos garantias que
PUT porque depende de la semantica del parche.

### Reflexion 6 (Paso 6): Por que DELETE repetido devuelve 404 y no 500

Un 500 significaria que el servidor tuvo un error inesperado - un
bug. Pero eliminar dos veces el mismo recurso no es un bug del
servidor: es una accion perfectamente valida del cliente que
simplemente no encuentra lo que quiere borrar. El codigo correcto
es 404 (Not Found) porque describe con precision lo que paso: el
recurso no existe. Ademas, DELETE es un verbo idempotente por
definicion REST: llamarlo N veces debe dejar el sistema en el
mismo estado final (el recurso ya no existe). El chequeo con
findIndex + throw NotFoundException garantiza esa idempotencia
sin reventar el servidor.

### Reflexion 7 (Paso 8): Que aporta HATEOAS al contrato

Sin HATEOAS, un cliente que consume GET /productos/{id} recibe
solo los datos y tiene que saber por documentacion externa que
puede hacer PUT, PATCH y DELETE sobre ese recurso. Con HATEOAS,
la respuesta misma le dice cuales son las siguientes acciones
posibles (via _links). Eso desacopla al cliente de la estructura
de URIs del servidor: si manana cambio /productos/{id} por
/catalogo/items/{id}, los clientes que siguen los _links siguen
funcionando sin cambios. Es el nivel 3 del modelo de madurez
REST de Richardson.

## Declaracion de uso de IA

- Herramienta(s): Claude (Anthropic)
- Nivel de uso: 2-3 (borrador / revisor)
- Que se le pidio:
  - Semana 1: explicaciones paso a paso de los pasos del laboratorio,
    ayuda para interpretar errores de TypeScript (particularmente
    TS1272 sobre 'isolatedModules' con interfaces en firmas
    decoradas) y clarificacion sobre decoradores de @nestjs/swagger.
  - Semana 2: guia paso a paso para completar el CRUD (POST, PUT,
    PATCH, DELETE) reutilizando el proyecto de Semana 1, esqueletos
    de DTOs con validaciones class-validator, y la implementacion
    HATEOAS del reto final.
- Que se modifico/verifico manualmente: ejecute cada comando y
  edicion en mi entorno local, verifique cada endpoint en Swagger
  UI con capturas de pantalla, confirme los codigos de estado
  esperados de la matriz (201, 204, 400, 404) y la presencia del
  header Location en el POST. Corregi manualmente el import de
  Response para usar 'import type' segun exige isolatedModules
  del proyecto.
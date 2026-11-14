# Bitácora — Práctica 3: Persistencia en base de datos relacional

**Autor:** Anthony Rosero
**Curso:** Integración de Sistemas
**Fecha:** 23 de septiembre de 2026

## Datos del despliegue

- **Repositorio en GitHub:** https://github.com/ajrm18/apisemana2
- **URL pública del servicio en Render:** https://apisemana2.onrender.com
- **Documentación Swagger:** https://apisemana2.onrender.com/api/docs
- **Motor de base de datos:** PostgreSQL 16 (en local corriendo dentro de un contenedor Docker en el puerto 5433; en producción, una base administrada por Render en la región Oregon)
- **ORM:** TypeORM sobre NestJS 11
- **Workflow de CI:** GitHub Actions ejecutando build y pruebas en cada push a `main`

## Por qué los datos sobreviven al reinicio del servidor

En la práctica anterior, los productos se guardaban en un arreglo declarado dentro de la clase `ProductosService`. Ese arreglo vive en la memoria RAM asignada al proceso de Node.js que corre `nest start`. Cuando el proceso se detiene con `Ctrl + C`, el sistema operativo libera toda la memoria que le había reservado, y con ella se pierde el arreglo entero. Al volver a arrancar el proceso, la memoria vuelve a inicializarse en cero y el arreglo se reconstruye con los valores literales que están escritos en el código fuente. Cualquier `POST`, `PUT`, `PATCH` o `DELETE` que se hubiera hecho antes del reinicio, desaparece.

En esta práctica, en cambio, la información ya no vive en la memoria del proceso de Node, sino en un archivo de datos administrado por PostgreSQL, que corre en un proceso completamente aparte: un contenedor Docker en el entorno local, y un servicio administrado en la nube en el entorno de Render. Ese proceso de Postgres persiste cada `INSERT`, `UPDATE` y `DELETE` en disco antes de responder que la operación terminó. Cuando la aplicación NestJS se apaga, el proceso de Postgres ni se entera: sigue corriendo con sus archivos intactos. Cuando NestJS vuelve a arrancar y TypeORM se reconecta, simplemente lee lo que ya estaba guardado.

La consecuencia práctica es la que se comprueba en el Paso 8: se crean varios productos por la API, se detiene el servidor con `Ctrl + C`, se vuelve a arrancar, y al consultar `GET /api/v1/productos` los mismos productos siguen ahí, con los mismos identificadores y precios. Esta separación entre el proceso de la aplicación y el proceso del motor de base de datos es la base sobre la que se construyen sistemas reales, donde reiniciar el backend (por un despliegue, un bug, una actualización) no puede significar perder los datos de los usuarios.

## Declaración de uso de IA

- **Herramienta(s):** Claude (Anthropic), utilizada tanto en la interfaz de chat como a través de Claude Code integrado en VS Code.
- **Nivel de uso:** 2-3 (borrador / revisor).
- **Qué se le pidió:** guía paso a paso para reemplazar el CRUD en memoria de la práctica anterior por PostgreSQL con TypeORM; configuración de Docker en Windows con un puerto alternativo (5433) debido al conflicto con una instalación previa de PostgreSQL 18 nativo; ajuste del workflow de GitHub Actions cuando fallaba por dependencias faltantes y por specs vacíos del template; guía completa del despliegue en Render con base de datos administrada; y redacción de esta bitácora.
- **Qué se modificó o verificó manualmente:** cada endpoint fue probado tanto en Swagger local como en la URL pública de Render; los datos se verificaron directamente con `SELECT * FROM productos;` dentro del contenedor Docker por `psql`, no solo desde la respuesta de la API; se ajustó manualmente el decorador `@Controller` para respetar el prefijo global `api/v1` que ya venía configurado desde la práctica 2; se borraron los archivos `.spec.ts` vacíos del template original de NestJS que impedían que GitHub Actions pasara; y se verificó que el archivo `.env` está listado en `.gitignore` y nunca se subió al repositorio.

---

# Semana 7 · Práctica 8: Contratos y validación con JSON Schema

**Autor:** Anthony Rosero (trabajo individual)
**Fecha:** 14 de noviembre de 2026
**Repositorio:** https://github.com/ajrm18/apisemana2 · **API:** https://apisemana2.onrender.com/api/v1/productos · **Swagger:** https://apisemana2.onrender.com/api/docs

## Registro de comandos y resultados

| # | Comando | Resultado |
|---|---|---|
| 1 | `git status` / `git pull` en `nestjs-productos-api` | Árbol limpio, `Already up to date` (`30d1401`) |
| 2 | `docker info` | Docker Desktop apagado; se abrió desde `%LOCALAPPDATA%\Programs\DockerDesktop` (no está en `C:\Program Files\Docker`) → Docker 29.9.2 |
| 3 | `docker start pg-productos` | Contenedor `postgres:16` en el puerto 5433; tabla con 3 productos (ids 1, 3, 4) |
| 4 | `npm install` + `npm run start:dev` + `GET /api/v1/productos` | 200 con los 3 productos, antes de tocar el controlador |
| 5 | `npm install ajv ajv-formats` | `ajv@8.20.0` y `ajv-formats@3.0.1` en `dependencies` |
| 6 | Esquema v1 + `git commit` | `fe847d0`: commit solo con el esquema (schema-first) |
| 7 | `new (require('ajv').default)().compile(v1)` | `Error: no schema with key or ref "https://json-schema.org/draft/2020-12/schema"` → se usa `ajv/dist/2020` (desviación 1) |
| 8 | POST sin `precio` / con `stock` / válido (v1) | 400 `missingProperty: "precio"` / 400 `additionalProperty: "stock"` / 201 con `Location` (`docs/evidencia-local.txt`) |
| 9 | Controlador con v2: POST v1 / `electronica` / `juguetes` | 201 / 201 / 400 `enum`; TypeORM agregó la columna `categoria` nullable |
| 10 | `check-compatibility.js` de la guía, sin cambios | v2 → v3-breaking: `compatible: true` (incorrecto) → `docs/evidencia-script-original.txt` |
| 11 | Script corregido | v2 → v3-breaking `compatible: false` ("Campo requerido nuevo sin default: categoria"); v1 → v2 `compatible: true` (`docs/evidencia-script.txt`) |
| 12 | Servidor temporal con v3-breaking + POST formato v1 | 400 `missingProperty: "categoria"` (cambio local revertido, no se commiteó) |
| 13 | `npm audit` | 32 vulnerabilidades (1 crítica, 5 altas); tras quitar `@nestjs/mau`/`@nestjs/observe` y `npm audit fix`: producción en 0, quedan 20 bajas/moderadas solo en la cadena de jest |
| 14 | `npm test` / `npm run test:e2e` | 23 unitarias y 13 e2e en verde |
| 15 | `scripts/verificar-contrato.ps1` y `.sh` (local) | PASS 9/9 en ambos |
| 16 | Instalación limpia (`rm -rf node_modules dist`, `npm ci`, build, lint `--deny-warnings`, test, e2e) | Todo en verde |

## Problemas resueltos

- **ajv y draft 2020-12**: con `import Ajv from 'ajv'` todos los POST respondían 500. Se cambió a `ajv/dist/2020` sin tocar el `$schema` de los archivos.
- **Script de la guía**: no detectaba que `categoria` pasara a requerida porque ya existía como opcional en v2. Se cambió solo esa condición.
- **Bash y el scratchpad**: Git Bash no veía la carpeta temporal de la sesión; el log del servidor se escribió en `dev.log` (ignorado por `*.log`) y se borró después.
- **PowerShell 5.1**: `Invoke-WebRequest` no expone el cuerpo del 400 en el stream de la respuesta; el script lo lee de `ErrorDetails.Message`.
- **Producción sin `synchronize`**: para que la columna `categoria` exista en Render se agregó una migración idempotente (`CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`), probada en una base temporal.

## Preguntas de cierre (Paso 7)

> Las responde el estudiante, sin ver la teoría y con justificación propia. Debajo de cada pregunta solo hay hechos observados en esta práctica.

### 1. ¿Cuál de los tres (JSON Schema con ajv, DTOs con class-validator de la Semana 2, contrato .proto de la Semana 3) se sintió más "contrato explícito", y por qué?

**Respuesta:**

&nbsp;

**Datos observados en esta práctica:**

- El contrato JSON Schema vive en archivos `.json` (`src/productos/schemas/`) y se commiteó (`fe847d0`) antes de cambiar el controlador.
- `check-compatibility.js` lee esos archivos sin cargar NestJS ni TypeScript.
- Los DTOs (`crear-producto.dto.ts`) son clases TypeScript con decoradores; sus reglas solo existen en el código de esta API.
- El `.proto` de la Semana 3 está en otro proyecto (`nestjs-productos-grpc`), en un archivo independiente del código del servidor.

### 2. ¿En qué escenario preferirías class-validator sobre JSON Schema, y viceversa?

**Respuesta:**

&nbsp;

**Datos observados en esta práctica:**

- Hoy conviven las dos fuentes de verdad: POST se valida con JSON Schema y PUT/PATCH con `class-validator`.
- Las reglas no coinciden: el DTO usa `@IsPositive()` (rechaza 0) y el esquema usa `minimum: 0` (acepta 0).
- El error de ajv devuelve `keyword`, `instancePath`, `schemaPath` y `params`; el de `class-validator` devuelve un arreglo de mensajes de texto (`property stock should not exist`).
- Con `body: any`, Swagger no muestra el contrato si no se agrega `@ApiBody({ schema })`.

### 3. Si tu equipo tuviera 5 consumidores externos de esta API, ¿usarías la política BACKWARD o FULL para versionar este esquema? Justifica.

**Respuesta:**

&nbsp;

**Datos observados en esta práctica:**

- v1 → v2 (campo opcional nuevo): el script da `compatible: true`, y una petición v1 recibe 201 con v2.
- v2 → v3-breaking (campo requerido sin default): `compatible: false`, y una petición v1 recibe 400 `missingProperty: "categoria"`.
- El script solo evalúa BACKWARD (lo nuevo acepta lo viejo). No comprueba FORWARD ni FULL, ni detecta la reducción de un `enum` o un `maximum` más estricto.
- Con `additionalProperties: false`, un cliente que ya envíe `categoria` es rechazado por v1 (400 `additionalProperties`).

## Despliegue en la nube (Render + Neon)

| # | Acción | Resultado |
|---|---|---|
| 1 | `GET https://apisemana2.onrender.com/api/v1/health` tras el push | Sin respuesta en 170 s; el deploy `e7a6f0d` terminó en `update_failed` |
| 2 | Logs de Render (API REST) | `Error: getaddrinfo ENOTFOUND dpg-dapucdid0e5s73af3hog-a`: la Postgres gratis de Render ya no existe |
| 3 | Neon (API REST): proyecto nuevo `apisemana2-p8` | `aws-us-west-2` (misma zona que Render Oregon), PostgreSQL 16, conexión directa con `sslmode=require`; no se tocó el proyecto existente |
| 4 | Render (API REST), solo el servicio `apisemana2` | `DATABASE_URL` (Neon), `NODE_ENV=production`, Build `npm ci --include=dev && npm run build`, Start `npm run start:prod`, Health `/api/v1/health` |
| 5 | Deploy `dep-dbscun3bc2fs73b7qd2g` (`e7a6f0d`) | `live` en 62 s; Render eligió Node 26.13.1 por `engines >=24`; la migración creó la tabla |
| 6 | `.\scripts\verificar-contrato.ps1 -BaseUrl https://apisemana2.onrender.com` | **PASS 9/9** (`docs/evidencia-nube.txt`) |
| 7 | Carga de los 3 productos por `POST` | ids 3, 4 y 5 (los ids 1 y 2 los usó y borró la verificación) |
| 8 | `GET /api/v1/productos/2147483648` en Render | 400 (antes 500); sin `X-Powered-By`, con `nosniff` |

# API Productos - Semana 1

API base construida con NestJS y documentada con Swagger/OpenAPI.
Curso: [nombre del curso] - PUCE
Autor: Anthony Rosero
Fecha: 15/09/2026

## Como ejecutar

npm install
npm run start:dev

- API: http://localhost:3000/api/v1/productos
- Swagger UI: http://localhost:3000/api/docs

## Endpoints implementados

| Metodo | Ruta                       | Descripcion              |
|--------|----------------------------|--------------------------|
| GET    | /api/v1/productos          | Lista todos los productos|
| GET    | /api/v1/productos/{id}     | Obtiene un producto      |

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

## Declaracion de uso de IA

- Herramienta(s): Claude (Anthropic)
- Nivel de uso: 2-3 (borrador / revisor)
- Que se le pidio: explicaciones paso a paso de los pasos del
  laboratorio, ayuda para interpretar errores de TypeScript
  (particularmente TS1272 sobre 'isolatedModules' con interfaces
  en firmas decoradas) y clarificacion sobre decoradores de
  @nestjs/swagger.
- Que se modifico/verifico manualmente: ejecute cada comando y
  editicion en mi entorno local, verifique cada endpoint en Swagger
  UI con capturas de pantalla (200, 404 y esquema ProductoDto),
  y confirme que la compilacion pasara sin errores antes de
  avanzar a cada paso.
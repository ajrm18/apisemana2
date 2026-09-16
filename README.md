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

| Metodo | Ruta                       | Descripcion                                |
|--------|----------------------------|--------------------------------------------|
| GET    | /api/v1/productos          | Lista todos los productos                  |
| GET    | /api/v1/productos/{id}     | Obtiene un producto (incluye enlaces HATEOAS) |
| POST   | /api/v1/productos          | Crea un producto nuevo                     |
| PUT    | /api/v1/productos/{id}     | Reemplaza un producto completo             |
| PATCH  | /api/v1/productos/{id}     | Actualiza parcialmente el precio           |
| DELETE | /api/v1/productos/{id}     | Elimina un producto (idempotente)          |

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
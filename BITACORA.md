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

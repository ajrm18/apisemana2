# Contrato de API — Semana 1

## Endpoint: Listar productos

| Campo               | Valor                                                |
|---------------------|------------------------------------------------------|
| Recurso             | /productos                                           |
| Verbo HTTP          | GET                                                  |
| URL completa        | GET http://localhost:3000/api/v1/productos           |
| Respuesta 200 (OK)  | Lista de objetos con la forma { id, nombre, precio } |
| Respuesta 500       | Error interno del servidor                           |

### Ejemplo de respuesta 200

```json
[
  { "id": 1, "nombre": "Teclado mecanico", "precio": 45.90 },
  { "id": 2, "nombre": "Mouse inalambrico", "precio": 19.50 },
  { "id": 3, "nombre": "Monitor 24 pulgadas", "precio": 129.99 }
]
```

## Endpoint: Obtener un producto por id

| Campo              | Valor                                            |
|--------------------|--------------------------------------------------|
| Recurso            | /productos/{id}                                  |
| Verbo HTTP         | GET                                              |
| URL completa       | GET http://localhost:3000/api/v1/productos/{id}  |
| Parametro de ruta  | id (numero entero)                               |
| Respuesta 200 (OK) | Objeto con la forma { id, nombre, precio }       |
| Respuesta 404      | Producto no encontrado                           |
| Respuesta 400      | El id enviado no es un numero valido             |

### Ejemplo de respuesta 200 (id = 1)

```json
{ "id": 1, "nombre": "Teclado mecanico", "precio": 45.90 }
```

### Ejemplo de respuesta 404 (id = 99)

```json
{
  "message": "Producto con id 99 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

---

# Contrato de API — Semana 2 (CRUD completo)

## Endpoint: Crear producto

| Campo               | Valor                                              |
|---------------------|----------------------------------------------------|
| Recurso             | /productos                                         |
| Verbo HTTP          | POST                                               |
| URL completa        | POST http://localhost:3000/api/v1/productos        |
| Cuerpo (body)       | JSON con la forma { nombre, precio }               |
| Respuesta 201       | Producto creado + header `Location` con la URI     |
| Respuesta 400       | Body invalido (nombre vacio o precio no positivo)  |

### Ejemplo de body

```json
{ "nombre": "Audifonos", "precio": 25.00 }
```

### Ejemplo de respuesta 201

```json
{ "id": 4, "nombre": "Audifonos", "precio": 25.00 }
```
Header: `Location: /api/v1/productos/4`

---

## Endpoint: Reemplazar producto (completo)

| Campo               | Valor                                              |
|---------------------|----------------------------------------------------|
| Recurso             | /productos/{id}                                    |
| Verbo HTTP          | PUT                                                |
| URL completa        | PUT http://localhost:3000/api/v1/productos/{id}    |
| Parametro de ruta   | id (numero entero)                                 |
| Cuerpo (body)       | JSON con la forma completa { nombre, precio }      |
| Respuesta 204       | Reemplazado correctamente (sin cuerpo)             |
| Respuesta 400       | Body invalido                                      |
| Respuesta 404       | Producto no encontrado                             |

### Ejemplo de body

```json
{ "nombre": "Teclado mecanico RGB", "precio": 55.00 }
```

---

## Endpoint: Actualizar precio (parcial)

| Campo               | Valor                                              |
|---------------------|----------------------------------------------------|
| Recurso             | /productos/{id}                                    |
| Verbo HTTP          | PATCH                                              |
| URL completa        | PATCH http://localhost:3000/api/v1/productos/{id}  |
| Parametro de ruta   | id (numero entero)                                 |
| Cuerpo (body)       | JSON con la forma { precio }                       |
| Respuesta 200       | Producto actualizado con el nuevo precio           |
| Respuesta 400       | Precio invalido (no numerico o no positivo)        |
| Respuesta 404       | Producto no encontrado                             |

### Ejemplo de body

```json
{ "precio": 60.00 }
```

### Ejemplo de respuesta 200

```json
{ "id": 1, "nombre": "Teclado mecanico", "precio": 60.00 }
```

---

## Endpoint: Eliminar producto

| Campo               | Valor                                              |
|---------------------|----------------------------------------------------|
| Recurso             | /productos/{id}                                    |
| Verbo HTTP          | DELETE                                             |
| URL completa        | DELETE http://localhost:3000/api/v1/productos/{id} |
| Parametro de ruta   | id (numero entero)                                 |
| Respuesta 204       | Eliminado correctamente (sin cuerpo)               |
| Respuesta 404       | Producto no encontrado (incluye eliminaciones repetidas del mismo id) |

---

## Resumen de la matriz CRUD

| Operación         | Verbo  | URI                        | Éxito             |
|-------------------|--------|----------------------------|-------------------|
| Listar            | GET    | `/api/v1/productos`        | 200               |
| Obtener uno       | GET    | `/api/v1/productos/{id}`   | 200 / 404         |
| Crear             | POST   | `/api/v1/productos`        | 201 + `Location`  |
| Reemplazar        | PUT    | `/api/v1/productos/{id}`   | 204               |
| Actualizar parcial| PATCH  | `/api/v1/productos/{id}`   | 200               |
| Eliminar          | DELETE | `/api/v1/productos/{id}`   | 204 / 404         |
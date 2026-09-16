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
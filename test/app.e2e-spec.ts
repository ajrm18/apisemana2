import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/configurar-app';

const BASE = '/api/v1/productos';

describe('API de productos (e2e, PostgreSQL real)', () => {
  let app: INestApplication<App>;
  const creados: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    for (const id of creados) {
      await request(app.getHttpServer()).delete(`${BASE}/${id}`);
    }
    await app.close();
  });

  it('GET /api/v1/health -> 200 con la base conectada y sin X-Powered-By', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', baseDatos: 'conectada' });
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  describe('POST /api/v1/productos (contrato JSON Schema v2)', () => {
    it('peticion formato v1 (sin categoria) -> 201 con Location', async () => {
      const res = await request(app.getHttpServer())
        .post(BASE)
        .send({ nombre: 'E2E sin categoria', precio: 10 })
        .expect(201);
      creados.push(res.body.id);
      expect(res.headers.location).toBe(`${BASE}/${res.body.id}`);
      expect(res.body).toMatchObject({ nombre: 'E2E sin categoria', precio: 10, categoria: null });
    });

    it('con categoria "electronica" -> 201 y se persiste', async () => {
      const res = await request(app.getHttpServer())
        .post(BASE)
        .send({ nombre: 'E2E laptop', precio: 899.99, categoria: 'electronica' })
        .expect(201);
      creados.push(res.body.id);
      const leido = await request(app.getHttpServer()).get(`${BASE}/${res.body.id}`).expect(200);
      expect(leido.body.categoria).toBe('electronica');
    });

    it.each([
      ['sin precio', { nombre: 'Auriculares' }, 'required'],
      ['campo stock', { nombre: 'Auriculares', precio: 10, stock: 5 }, 'additionalProperties'],
      ['precio negativo', { nombre: 'Auriculares', precio: -1 }, 'minimum'],
      ['precio gigante', { nombre: 'Auriculares', precio: 100000000 }, 'maximum'],
      ['categoria invalida', { nombre: 'Pelota', precio: 5, categoria: 'juguetes' }, 'enum'],
    ])('%s -> 400 del pipe ajv (%s)', async (_caso, body, keyword) => {
      const res = await request(app.getHttpServer()).post(BASE).send(body).expect(400);
      expect(res.body.mensaje).toBe('El cuerpo de la peticion no cumple el contrato JSON Schema');
      expect(res.body.errores[0].keyword).toBe(keyword);
    });
  });

  describe('PUT y PATCH siguen con DTOs de class-validator', () => {
    it('PUT con campo extra -> 400 del ValidationPipe', async () => {
      const res = await request(app.getHttpServer())
        .put(`${BASE}/1`)
        .send({ nombre: 'X', precio: 1, stock: 5 })
        .expect(400);
      expect(res.body.message).toContain('property stock should not exist');
    });

    it('PATCH con precio gigante -> 400', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE}/1`)
        .send({ precio: 100000000 })
        .expect(400);
    });
  });

  describe('entradas fuera de rango no producen 500', () => {
    it.each(['get', 'delete'] as const)('%s con id 2147483648 -> 400', async (metodo) => {
      await request(app.getHttpServer())[metodo](`${BASE}/2147483648`).expect(400);
    });

    it('id inexistente -> 404', async () => {
      await request(app.getHttpServer()).get(`${BASE}/2147483647`).expect(404);
    });
  });
});

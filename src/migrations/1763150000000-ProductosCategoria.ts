import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Produccion corre con synchronize: false, asi que el esquema se aplica con esta
 * migracion idempotente: crea la tabla si la base es nueva (por ejemplo, Neon) y
 * agrega la columna nullable `categoria` del esquema v2 si la tabla ya existia.
 */
export class ProductosCategoria1763150000000 implements MigrationInterface {
  name = 'ProductosCategoria1763150000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "productos" (
        "id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "precio" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_04f604609a0949a7f3b43400766" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "categoria" character varying`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN IF EXISTS "categoria"`);
  }
}

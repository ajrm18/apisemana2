import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { ProductosModule } from './productos/productos.module';
import { ProductosCategoria1763150000000 } from './migrations/1763150000000-ProductosCategoria';
import { CorrelationIdMiddleware } from './common/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error('Falta la variable de entorno DATABASE_URL (ver .env.example)');
        }
        const produccion = config.get<string>('NODE_ENV') === 'production';
        return {
          type: 'postgres' as const,
          url,
          autoLoadEntities: true,
          // En produccion el esquema solo cambia por migraciones (fallo recurrente R18).
          synchronize: !produccion,
          migrations: [ProductosCategoria1763150000000],
          migrationsRun: true,
          ssl:
            produccion || config.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        };
      },
    }),
    ProductosModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  // Semana 8: log de trazabilidad en todas las rutas (incluye /api/v1/health).
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*path');
  }
}

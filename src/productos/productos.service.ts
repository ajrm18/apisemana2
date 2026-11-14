import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Producto } from './producto.entity';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarPrecioDto } from './dto/actualizar-precio.dto';

/** Forma del cuerpo de POST /productos ya validado por el JSON Schema. */
export interface DatosNuevoProducto {
  nombre: string;
  precio: number;
  categoria?: string;
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productosRepository: Repository<Producto>,
  ) {}

  findAll(nombre?: string): Promise<Producto[]> {
    if (!nombre) return this.productosRepository.find();
    return this.productosRepository.find({
      where: { nombre: ILike(`%${nombre}%`) },
    });
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productosRepository.findOneBy({ id });
    if (!producto) throw new NotFoundException(`Producto ${id} no existe`);
    return producto;
  }

  async crear(datos: DatosNuevoProducto): Promise<Producto> {
    // Solo se copian los campos del contrato (el JSON Schema ya rechazo los extra).
    const nuevo = this.productosRepository.create({
      nombre: datos.nombre,
      precio: datos.precio,
    });
    return this.productosRepository.save(nuevo);
  }

  async reemplazar(id: number, dto: CrearProductoDto): Promise<void> {
    const producto = await this.findOne(id);
    await this.productosRepository.save({ ...producto, ...dto });
  }

  async actualizarPrecio(id: number, dto: ActualizarPrecioDto): Promise<Producto> {
    const producto = await this.findOne(id);
    producto.precio = dto.precio;
    return this.productosRepository.save(producto);
  }

  async eliminar(id: number): Promise<void> {
    const resultado = await this.productosRepository.delete(id);
    if (resultado.affected === 0) {
      throw new NotFoundException(`Producto ${id} no existe`);
    }
  }
}
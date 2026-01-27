import { z } from 'zod';

export const clienteSchema = z.object({
  rut: z.string().min(1, 'El RUT es requerido'),
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  contacto: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  notas: z.string().optional().nullable(),
  estado: z.enum(['activo', 'inactivo', 'prospecto']).default('activo'),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'user']).default('user'),
});


export const notaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  contenido: z.string().min(1, 'El contenido es requerido'),
  favorita: z.boolean().default(false),
  color: z.enum(['slate', 'cyan', 'violet', 'emerald', 'amber', 'rose']).default('slate'),
});

export type NotaInput = z.infer<typeof notaSchema>;

export const accesoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.string().min(1, 'El tipo es requerido'),
  url: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
  puerto: z.string().optional().nullable(),
  usuario: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  clienteId: z.string().optional().nullable(),
});


export const contactSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido (mínimo 2 caracteres)'),
  empresa: z.string().optional().nullable(),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional().nullable(),
  mensaje: z.string().min(10, 'El mensaje es requerido (mínimo 10 caracteres)'),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const enlaceSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  url: z.string().url('URL inválida'),
  categoria: z.enum(['infraestructura', 'monitoreo', 'desarrollo', 'documentacion', 'otros']).default('otros'),
  descripcion: z.string().optional().nullable(),
  icono: z.enum(['link', 'server', 'shield', 'cloud', 'code', 'database', 'monitor', 'folder']).default('link'),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
});

export type EnlaceInput = z.infer<typeof enlaceSchema>;

// CRM Schemas

export const servicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional().nullable(),
  precio: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  tipo: z.enum(['mensual', 'anual', 'unico', 'hora']).default('mensual'),
  categoria: z.enum(['hosting', 'desarrollo', 'mantenimiento', 'consultoria', 'general']).default('general'),
  activo: z.boolean().default(true),
});
export type ServicioInput = z.infer<typeof servicioSchema>;

export const suscripcionSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido'),
  servicioId: z.string().min(1, 'El servicio es requerido'),
  precio: z.number().min(0, 'El precio es requerido'),
  ciclo: z.enum(['mensual', 'anual', 'trimestral']).default('mensual'),
  fechaInicio: z.string().transform((str) => new Date(str)), // Input as string from form
  fechaFin: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  estado: z.enum(['activa', 'pausada', 'cancelada', 'pendiente']).default('activa'),
  notas: z.string().optional().nullable(),
});
export type SuscripcionInput = z.infer<typeof suscripcionSchema>;

export const proyectoSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido'),
  nombre: z.string().min(1, 'El nombre del proyecto es requerido'),
  descripcion: z.string().optional().nullable(),
  estado: z.enum(['planificacion', 'desarrollo', 'pruebas', 'completado', 'pausado', 'cancelado']).default('planificacion'),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).default('media'),
  fechaInicio: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  fechaFin: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  presupuesto: z.number().optional().nullable(),
  avance: z.number().min(0).max(100).default(0),
});
export type ProyectoInput = z.infer<typeof proyectoSchema>;

export const tareaSchema = z.object({
  proyectoId: z.string().min(1, 'El proyecto es requerido'),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional().nullable(),
  estado: z.enum(['pendiente', 'en_progreso', 'revision', 'completada']).default('pendiente'),
  prioridad: z.enum(['baja', 'media', 'alta']).default('media'),
  fechaVenc: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  asignadoAId: z.string().optional().nullable(),
});
export type TareaInput = z.infer<typeof tareaSchema>;

export const itemFacturaSchema = z.object({
  servicioId: z.string().optional().nullable(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  precioUnit: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  // total is calculated
});

export const facturaSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido'),
  numero: z.string().min(1, 'El número de factura es requerido'),
  numeroSII: z.string().optional().nullable(),
  fechaEmision: z.string().transform((str) => new Date(str)),
  fechaVenc: z.string().transform((str) => new Date(str)),
  estado: z.enum(['emitida', 'enviada', 'pendiente', 'pagada', 'cancelada', 'vencida']).default('emitida'),
  moneda: z.enum(['CLP', 'USD', 'UF']).default('CLP'),
  items: z.array(itemFacturaSchema).min(1, 'Debe haber al menos un ítem'),
  notas: z.string().optional().nullable(),
  proyectoId: z.string().optional().nullable(),
  aplicarIVA: z.boolean().optional().default(true),
});
export type FacturaInput = z.infer<typeof facturaSchema>;

export const itemCotizacionSchema = z.object({
  servicioId: z.string().optional().nullable(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  precioUnit: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

export const cotizacionSchema = z.object({
  clienteId: z.string().optional().nullable(), // Optional for prospects
  nombreProspecto: z.string().optional().nullable(),
  emailProspecto: z.string().email().optional().nullable(),
  numero: z.string().min(1, 'El número de cotización es requerido'),
  fecha: z.string().transform((str) => new Date(str)),
  validez: z.string().transform((str) => new Date(str)),
  estado: z.enum(['borrador', 'enviada', 'aprobada', 'rechazada', 'vencida']).default('borrador'),
  moneda: z.enum(['CLP', 'USD', 'UF']).default('CLP'),
  items: z.array(itemCotizacionSchema).min(1, 'Debe haber al menos un ítem'),
  notas: z.string().optional().nullable(),
  aplicarIVA: z.boolean().optional().default(true),
}).refine(data => data.clienteId || (data.nombreProspecto && data.emailProspecto), {
  message: "Debe especificar un cliente o los datos del prospecto",
  path: ["clienteId"],
});
export type CotizacionInput = z.infer<typeof cotizacionSchema>;

export const comunicacionSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido'),
  tipo: z.string().min(1, 'El tipo es requerido'), // email, telefono, etc
  fecha: z.string().transform((str) => new Date(str)),
  resumen: z.string().min(1, 'El resumen es requerido'),
  detalle: z.string().optional().nullable(),
  resultado: z.string().optional().nullable(),
  usuarioId: z.string().min(1, 'El usuario es requerido'),
});
export type ComunicacionInput = z.infer<typeof comunicacionSchema>;

export const gastoSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0'),
  motivo: z.string().min(1, 'El motivo es requerido'),
  categoria: z.enum(['servicios', 'insumos', 'software', 'hardware', 'marketing', 'otros']).default('otros'),
  fecha: z.string().transform((str) => new Date(str)),
  proveedor: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export type GastoInput = z.infer<typeof gastoSchema>;

import { z } from "zod";

/**
 * Los estados permitidos para un usuario.
 * `as const` convierte el array en una tupla de solo lectura, así que
 * `Estado` queda como el union type "activo" | "inactivo".
 */
export const ESTADOS = ["activo", "inactivo"] as const;
export type Estado = (typeof ESTADOS)[number];

/**
 * La forma de un usuario tal como la ve el cliente del MCP.
 * Las fechas son strings ISO 8601 porque el protocolo transporta JSON.
 */
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  correo: string;
  estado: Estado;
  fechaCreacion: string;
  fechaModificacion: string;
}

/** Todo lo que se necesita para crear un usuario (sin id ni fechas). */
export type DatosUsuario = Omit<Usuario, "id" | "fechaCreacion" | "fechaModificacion">;

/** Campos que se pueden cambiar en una actualización parcial. */
export type CambiosUsuario = Partial<DatosUsuario>;

const esquemaEstado = z.enum(ESTADOS).describe('Estado del usuario: "activo" o "inactivo"');

const esquemaNombre = z.string().min(1).max(80).describe("Nombre del usuario");
const esquemaApellido = z.string().min(1).max(80).describe("Apellido del usuario");
const esquemaTelefono = z
  .string()
  .min(7)
  .max(25)
  .describe("Teléfono del usuario, incluido el indicativo si aplica");
const esquemaDireccion = z.string().min(1).max(200).describe("Dirección postal del usuario");
const esquemaCorreo = z.email().max(120).describe("Correo electrónico único del usuario");

/**
 * Esquema de entrada de `crear_usuario`.
 *
 * El SDK convierte este esquema de Zod a JSON Schema y lo publica en
 * `tools/list`; además valida los argumentos ANTES de ejecutar el handler.
 * Por eso el tipo del handler se infiere de aquí y no hace falta validar a mano.
 */
export const esquemaCrearUsuario = z.object({
  nombre: esquemaNombre,
  apellido: esquemaApellido,
  telefono: esquemaTelefono,
  direccion: esquemaDireccion,
  correo: esquemaCorreo,
  estado: esquemaEstado.default("activo"),
});

/** Esquema de entrada de `actualizar_usuario`: id obligatorio, resto opcional. */
export const esquemaActualizarUsuario = z.object({
  id: z.number().int().positive().describe("Id del usuario a actualizar"),
  nombre: esquemaNombre.optional(),
  apellido: esquemaApellido.optional(),
  telefono: esquemaTelefono.optional(),
  direccion: esquemaDireccion.optional(),
  correo: esquemaCorreo.optional(),
  estado: esquemaEstado.optional(),
});

/** Esquema de entrada de `eliminar_usuario`. */
export const esquemaEliminarUsuario = z.object({
  id: z.number().int().positive().describe("Id del usuario a eliminar"),
});

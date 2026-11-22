import { USUARIOS_SEMILLA } from "./seed.js";
import type { CambiosUsuario, DatosUsuario, Usuario } from "./types.js";

/**
 * Capa de datos: un Map en memoria.
 *
 * Esta capa NO sabe nada de MCP. Podrías reemplazarla por SQLite, un API REST
 * o un archivo y las tools seguirían funcionando igual.
 */

/** Se crea una vez al importar el módulo, cuando arranca el proceso. */
const usuarios = new Map<number, Usuario>();

/** El primer id libre después de la semilla (en este caso, 21). */
let siguienteId = 1;

for (const usuario of USUARIOS_SEMILLA) {
  usuarios.set(usuario.id, { ...usuario });
  siguienteId = Math.max(siguienteId, usuario.id + 1);
}

/** Devuelve copias para que nadie pueda mutar el Map sin pasar por aquí. */
function copiar(usuario: Usuario): Usuario {
  return { ...usuario };
}

function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export function listarUsuarios(): Usuario[] {
  return Array.from(usuarios.values(), copiar);
}

export function existeCorreo(correo: string, exceptoId?: number): boolean {
  const buscado = normalizarCorreo(correo);
  return Array.from(usuarios.values()).some(
    (usuario) => usuario.id !== exceptoId && normalizarCorreo(usuario.correo) === buscado,
  );
}

export function crearUsuario(datos: DatosUsuario): Usuario {
  const ahora = new Date().toISOString();
  const usuario: Usuario = {
    id: siguienteId++,
    ...datos,
    fechaCreacion: ahora,
    fechaModificacion: ahora,
  };
  usuarios.set(usuario.id, usuario);
  return copiar(usuario);
}

/** Devuelve `null` cuando no existe el id. */
export function actualizarUsuario(id: number, cambios: CambiosUsuario): Usuario | null {
  const usuario = usuarios.get(id);
  if (!usuario) return null;

  const actualizado: Usuario = {
    ...usuario,
    ...cambios,
    fechaModificacion: new Date().toISOString(),
  };
  usuarios.set(id, actualizado);
  return copiar(actualizado);
}

/** Devuelve `null` cuando no existe el id. */
export function eliminarUsuario(id: number): Usuario | null {
  const usuario = usuarios.get(id);
  if (!usuario) return null;

  usuarios.delete(id);
  return copiar(usuario);
}

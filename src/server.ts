import { McpServer, type CallToolResult } from "@modelcontextprotocol/server";
import {
  esquemaActualizarUsuario,
  esquemaCrearUsuario,
  esquemaEliminarUsuario,
} from "./types.js";
import * as store from "./store.js";

/**
 * Capa MCP: aquí se definen las herramientas que verá el modelo.
 *
 * Una "tool" es una función con nombre, descripción y un esquema de entrada.
 * El cliente descubre las tools con `tools/list` y las ejecuta con
 * `tools/call`. El SDK se encarga del JSON-RPC por nosotros.
 */

/** Toda respuesta de una tool es una lista de bloques de contenido. */
function comoTexto(datos: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(datos, null, 2) }],
  };
}

/**
 * Los errores de negocio NO se lanzan como excepción: se devuelven con
 * `isError: true` para que el modelo pueda leerlos y corregir su llamada.
 * Los errores de validación de entrada ya los maneja el SDK con Zod.
 */
function fallo(mensaje: string): CallToolResult {
  return {
    content: [{ type: "text", text: mensaje }],
    isError: true,
  };
}

export function crearServidor(): McpServer {
  const server = new McpServer({
    name: "mcp-redzilla",
    version: "1.0.0",
  });

  server.registerTool(
    "listar_usuarios",
    {
      title: "Listar usuarios",
      description: "Devuelve todos los usuarios almacenados, con un total y sus datos completos.",
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async () => {
      const usuarios = store.listarUsuarios();
      return comoTexto({ total: usuarios.length, usuarios });
    },
  );

  server.registerTool(
    "crear_usuario",
    {
      title: "Crear usuario",
      description:
        "Crea un usuario nuevo. Genera su id y las fechas de creación y modificación. " +
        "El estado por defecto es 'activo'. El correo debe ser único.",
      inputSchema: esquemaCrearUsuario,
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    async (datos) => {
      if (store.existeCorreo(datos.correo)) {
        return fallo(`Ya existe un usuario con el correo "${datos.correo}".`);
      }

      const usuario = store.crearUsuario(datos);
      return comoTexto({ mensaje: "Usuario creado correctamente.", usuario });
    },
  );

  server.registerTool(
    "actualizar_usuario",
    {
      title: "Actualizar usuario",
      description:
        "Modifica los campos indicados de un usuario por su id. " +
        "Los campos no enviados se conservan. Actualiza fechaModificacion y mantiene fechaCreacion.",
      inputSchema: esquemaActualizarUsuario,
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    async ({ id, ...cambios }) => {
      if (Object.keys(cambios).length === 0) {
        return fallo("Debes enviar al menos un campo para actualizar.");
      }

      if (cambios.correo && store.existeCorreo(cambios.correo, id)) {
        return fallo(`Ya existe otro usuario con el correo "${cambios.correo}".`);
      }

      const usuario = store.actualizarUsuario(id, cambios);
      if (!usuario) {
        return fallo(`No existe un usuario con id ${id}.`);
      }

      return comoTexto({ mensaje: "Usuario actualizado correctamente.", usuario });
    },
  );

  server.registerTool(
    "eliminar_usuario",
    {
      title: "Eliminar usuario",
      description: "Elimina un usuario por su id y devuelve los datos del usuario eliminado.",
      inputSchema: esquemaEliminarUsuario,
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ id }) => {
      const usuario = store.eliminarUsuario(id);
      if (!usuario) {
        return fallo(`No existe un usuario con id ${id}.`);
      }

      return comoTexto({ mensaje: "Usuario eliminado correctamente.", usuario });
    },
  );

  return server;
}

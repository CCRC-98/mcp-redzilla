import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { crearServidor } from "./server.js";

/**
 * Punto de entrada del servidor.
 *
 * `serveStdio` abre el canal JSON-RPC en stdin/stdout y crea una instancia
 * del servidor por conexión. Por eso los datos en memoria son privados de
 * cada cliente que lo lanza.
 */
void serveStdio(crearServidor);

// stdout está reservado para el protocolo: cualquier log va a stderr.
console.error("[mcp-redzilla] Servidor MCP iniciado en stdio");

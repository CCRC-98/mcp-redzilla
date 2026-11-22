import { createMcpHandler } from "@modelcontextprotocol/server";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { crearServidor } from "./server.js";

/**
 * Entrada HTTP para despliegue (Dokploy, Docker, un servidor Node...).
 *
 * A diferencia de `index.ts` (stdio), aquí un único proceso atiende a muchos
 * clientes en la misma URL. `createMcpHandler` crea una instancia de McpServer
 * por petición, pero el store de `store.ts` vive a nivel de módulo: el estado
 * de los usuarios se comparte entre todos los clientes del contenedor.
 */

const puerto = Number(process.env.PORT ?? 3000);

/** Hostnames permitidos por el header Host (sin esquema ni puerto). */
const hostsPermitidos = (process.env.MCP_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const handler = createMcpHandler(crearServidor);
const nodeHandler = toNodeHandler(handler);

const app = createMcpExpressApp({
  host: "0.0.0.0",
  ...(hostsPermitidos.length > 0 ? { allowedHosts: hostsPermitidos } : {}),
});

/** Health check para Dokploy y para pruebas rápidas. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/** Endpoint MCP (Streamable HTTP): acepta GET y POST. */
app.all("/mcp", (req, res) => {
  void nodeHandler(req, res, req.body);
});

const servidor = app.listen(puerto, "0.0.0.0", () => {
  console.error(`[mcp-redzilla] Servidor MCP HTTP escuchando en 0.0.0.0:${puerto}/mcp`);
});

/** Al cerrar el contenedor, dejamos de aceptar peticiones y cerramos el handler. */
async function detener(): Promise<void> {
  servidor.close();
  await handler.close();
  process.exit(0);
}

process.on("SIGINT", () => void detener());
process.on("SIGTERM", () => void detener());

import { createServer as createHttpServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(projectDirectory, "public");
const prototypesDirectory = path.join(projectDirectory, "prototypes");
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(message);
}

async function serveFile(response, baseDirectory, requestedPath, method, isPrototype, readFileImplementation) {
  const filePath = path.resolve(baseDirectory, requestedPath);
  const relativePath = path.relative(baseDirectory, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendText(response, 404, "Página não encontrada.");
    return;
  }

  const contentType = mimeTypes.get(path.extname(filePath).toLowerCase());
  if (!contentType) {
    sendText(response, 404, "Arquivo não encontrado.");
    return;
  }

  let contents;
  try {
    contents = await readFileImplementation(filePath);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR" || error.code === "ENOTDIR") {
      sendText(response, 404, "Página não encontrada.");
      return;
    }
    throw error;
  }

  response.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Security-Policy": isPrototype
      ? "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'"
      : "default-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
    "Content-Type": contentType,
    "Referrer-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(method === "HEAD" ? undefined : contents);
}

export function createServer({ readFileImplementation = readFile } = {}) {
  return createHttpServer((request, response) => {
    handleRequest(request, response, readFileImplementation).catch((error) => {
      console.error("Falha ao processar solicitação:", error);
      if (response.headersSent) {
        response.destroy();
        return;
      }
      sendText(response, 500, "Não foi possível carregar a página.");
    });
  });
}

async function handleRequest(request, response, readFileImplementation) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Método não permitido.");
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
      sendText(response, 400, "Endereço inválido.");
      return;
    }

    const isPrototype = pathname.startsWith("/prototypes/");
    const baseDirectory = isPrototype ? prototypesDirectory : publicDirectory;
    let requestedPath = isPrototype ? pathname.slice("/prototypes/".length) : pathname.slice(1);
    if (pathname === "/" || requestedPath === "") requestedPath = "index.html";
    await serveFile(response, baseDirectory, requestedPath, request.method, isPrototype, readFileImplementation);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer();
  const port = Number(process.env.PORT || 4173);
  server.listen(port, "127.0.0.1", () => {
    console.log(`Palavra Perto disponível em http://127.0.0.1:${port}`);
  });
}

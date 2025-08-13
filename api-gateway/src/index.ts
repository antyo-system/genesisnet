
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const spec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "openapi.json"), "utf8")
);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

const serviceMap: Record<string, string> = {
  network: process.env.NETWORK_SVC_URL || "http://localhost:4001",
  tx: process.env.TX_SVC_URL || "http://localhost:4002",
  search: process.env.SEARCH_SVC_URL || "http://localhost:4003",
  metrics: process.env.METRICS_SVC_URL || "http://localhost:4004",
  ws: process.env.WS_SVC_URL || "http://localhost:4005",
  blockchain: process.env.BLOCKCHAIN_SVC_URL || "http://localhost:4006",
};

app.use("/api/:service", (req, res, next) => {
  const target = serviceMap[req.params.service];
  if (!target) {
    res.sendStatus(502);
    return;
  }

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^/api/${req.params.service}`]: "" },
  })(req, res, next);
});

app.listen(PORT, () => {
  console.log(`api-gateway service listening on port ${PORT}`);
});
=======
import http from "node:http";

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.statusCode = 404;
  res.end();
});

server.listen(PORT, () => {
  console.log(`api-gateway service listening on port ${PORT}`);
});


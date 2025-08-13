
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "@genesisnet/env";

const app = express();
const PORT = env.API_GATEWAY_PORT;

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


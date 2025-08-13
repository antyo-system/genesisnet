
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { env } from "@genesisnet/env";
import { signJwt, verifyJwt } from "@genesisnet/utils";
import { logger } from "./logger";
import { activityLogger, errorLogger } from "@genesisnet/activity-log";

const app = express();
const PORT = env.API_GATEWAY_PORT;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
app.use(activityLogger);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const users = new Map<string, string>();

const authGuard: express.RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.sendStatus(401);
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    (req as any).user = verifyJwt(token);
    next();
  } catch {
    res.sendStatus(401);
  }
};

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    res.status(400).json({ message: "Email and password required" });
    return;
  }
  if (users.has(email)) {
    res.status(400).json({ message: "Email already registered" });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  users.set(email, hash);
  res.status(201).json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  const hash = email ? users.get(email) : undefined;
  if (!email || !password || !hash) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const expiresIn = 60 * 60;
  const accessToken = signJwt({ email }, { expiresIn });
  res.json({ access_token: accessToken, expires_in: expiresIn });
});

app.get("/api/protected", authGuard, (_req, res) => {
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

app.use(errorLogger);
export const clearUsers = () => users.clear();
export { app };

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`api-gateway service listening on port ${PORT}`);
  });
}


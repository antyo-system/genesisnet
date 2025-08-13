import http from "node:http";
import { env } from "@genesisnet/env";

const PORT = env.BLOCKCHAIN_PORT;

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
  console.log(`blockchain-svc service listening on port ${PORT}`);
});


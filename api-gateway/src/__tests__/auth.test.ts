import request from "supertest";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";

let app: any;
let clearUsers: () => void;

beforeAll(async () => {
  process.env.DB_URL = "http://localhost";
  process.env.REDIS_URL = "http://localhost";
  process.env.JWT_SECRET = "test";
  process.env.NODE_ENV = "test";
  const mod = await import("../index");
  app = mod.app;
  clearUsers = mod.clearUsers;
});

beforeEach(() => {
  clearUsers();
});

describe("auth", () => {
  it("registers a user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "pass" });
    expect(res.status).toBe(201);
  });

  it("prevents duplicate registration", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "pass" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "pass" });
    expect(res.status).toBe(400);
  });

  it("logs in a user", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "pass" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@test.com", password: "pass" });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it("rejects invalid password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "pass" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@test.com", password: "wrong" });
    expect(res.status).toBe(401);
  });
});

import jwt from "jsonwebtoken";
import { env } from "@genesisnet/env";

const SECRET = env.JWT_SECRET;

export const signJwt = (
  payload: object,
  options?: jwt.SignOptions
): string => {
  return jwt.sign(payload, SECRET, { expiresIn: "1h", ...options });
};

export const verifyJwt = <T>(token: string): T => {
  return jwt.verify(token, SECRET) as T;
};

import { Request, Response, NextFunction } from "express";
import { AppError } from "./errors";

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
}

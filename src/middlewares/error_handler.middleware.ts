import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    ...((err as any).details && { details: (err as any).details }),
  });
};

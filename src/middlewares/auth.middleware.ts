import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import createHttpError from "http-errors";

interface JWTPayload {
  id: number;
  role: string;
}

// extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(createHttpError.Unauthorized("Authorization header missing"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(createHttpError.Unauthorized("Token missing"));
    }

    const decoded = jwt.verify(token, config.admin_jwt_secret) as JWTPayload;
    if (decoded.role !== "admin") {
      return next(createHttpError.Forbidden("Admins only"));
    }
    req.user = decoded;
    next();
  } catch (error) {
    return next(createHttpError.Unauthorized("Invalid or expired token"));
  }
};

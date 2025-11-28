import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

export const hashPassword = (plainPassword: string) => {
  const saltRounds = 8;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(plainPassword, salt);
  return hash;
};

export const comparePassword = (
  plainPassword: string,
  hashedPassword: string
) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

export const generateToken = (payload: object) => {
  const secretKey = config.admin_jwt_secret;
  return jwt.sign(payload, secretKey, { expiresIn: "1d", algorithm: "HS256" });
};

import { db } from "../config/database";
import { users } from "../db/schema/user";
import { comparePassword, generateToken } from "../lib/auth.helper";
import { sql } from "drizzle-orm";
import createHttpError from "http-errors";

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  static async login({ email, password }: LoginInput) {
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          name: users.name,
        })
        .from(users)
        .where(sql`${users.email} = ${email}`);

      if (result.length === 0) {
        throw new createHttpError.NotFound("Invalid email or password");
      }

      const user = result[0];
      if (!comparePassword(password, user.password)) {
        throw new createHttpError.NotFound("Invalid email or password");
      }

      const token = generateToken({ id: user.id, role: "admin" });

      return { user: { name: user.name, email: user.email }, token };
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static async me(userId: string) {
    try {
      const result = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          mobile: users.mobile,
          created_at: users.created_at,
        })
        .from(users)
        .where(sql`${users.id} = ${userId}`);
      if (result.length === 0) {
        throw new createHttpError.NotFound("User not found");
      }
      return result[0];
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }
}

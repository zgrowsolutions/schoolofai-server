import { db } from "../config/database";
import { users } from "../db/schema/ai365_user";
import { comparePassword, generatePasswordResetToken, generateToken, verifyPasswordResetToken, hashPassword } from "../lib/auth.helper";
import { eq, sql } from "drizzle-orm";
import createHttpError from "http-errors";
import appevent from "../events/app.events";

interface LoginInput {
  email: string;
  password: string;
}

interface PasswordResetInput {
  userId: string;
  oldPassword: string;
  newPassword: string;
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

      const token = generateToken({ id: user.id, role: "ai365_user" });

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

  static async requestPasswordReset(email: string) {
    try {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (!result) {
        throw new createHttpError.NotFound("User not found");
      }
      const name = result.name;
      const userId = result.id;
      const oldPasswordHash = result.password;
      const token = generatePasswordResetToken({ id: userId }, oldPasswordHash);
      appevent.emit("passwordResetRequested", { userId, name, email, token });
      return { message: "Please check your email for the password reset link." };
    } catch (error) {
      console.error("Error:", error);
      throw new createHttpError.InternalServerError("Error requesting password reset");
    }
  }

  static async resetPassword(userId: string, token: string, newPassword: string) {
    
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new createHttpError.NotFound("User not found");
      }

    
      const oldPasswordHash = user.password;
      const isValid = verifyPasswordResetToken(token, oldPasswordHash);
      if (!isValid) {
        throw new createHttpError.Unauthorized("Invalid link or expired link. Please request a new password reset link.");
      }
      const newPasswordHash = hashPassword(newPassword);
      await db.update(users).set({ password: newPasswordHash }).where(eq(users.id, userId));
      return { message: "Password reset successfully" };
    }
    
  
}
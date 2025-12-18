import { db } from "../config/database";
import { users } from "../db/schema/ai365_user";
import { hashPassword } from "../lib/auth.helper";
import { desc, InferInsertModel, eq, ne, and } from "drizzle-orm";
import createHttpError from "http-errors";

type NewUser = InferInsertModel<typeof users>;
type UpdateUserInput = {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
};

export class UserService {
  static async create(user: NewUser) {
    try {
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email));

      if (existingEmail) {
        throw createHttpError.NotAcceptable(
          `User already exist with email ${user.email}`
        );
      }

      const [existingMobile] = await db
        .select()
        .from(users)
        .where(eq(users.mobile, user.mobile));

      if (existingMobile) {
        throw createHttpError.NotAcceptable(
          `User already exist with mobile ${user.mobile}`
        );
      }

      const result = await db.insert(users).values({
        ...user,
        password: hashPassword(user.password),
      });
      return result;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static async list() {
    try {
      const usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          mobile: users.mobile,
          created_at: users.created_at,
        })
        .from(users)
        .orderBy(desc(users.created_at));
      return usersList;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      return await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static async update(id: string, data: UpdateUserInput) {
    const { name, email, mobile, password } = data;

    // 1. Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    if (!existingUser) {
      throw createHttpError.NotFound("User not found");
    }

    // 2. Check unique email (if updating)
    if (email) {
      const [emailUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, id)));

      if (emailUser) {
        throw createHttpError.NotAcceptable("Email already exists");
      }
    }

    // 3. Check unique mobile (if updating)
    if (mobile) {
      const [mobileUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.mobile, mobile), ne(users.id, id)));

      if (mobileUser) {
        throw createHttpError.NotAcceptable("Mobile number already exists");
      }
    }

    // 4. Prepare update object
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;

    if (password) {
      updateData.password = hashPassword(password);
    }

    // 5. Update user
    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return updated[0];
  }
}

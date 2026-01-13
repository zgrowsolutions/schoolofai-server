import { db } from "../config/database";
import { users } from "../db/schema/ai365_user";
import { hashPassword } from "../lib/auth.helper";
import { InferInsertModel, eq, ne, and, or, ilike, sql } from "drizzle-orm";
import createHttpError from "http-errors";

type NewUser = InferInsertModel<typeof users>;
type UpdateUserInput = {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
};

interface ListUserParams {
  page?: number;
  limit?: number;
  search?: string;
}

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

  static async list({ page = 1, limit = 10, search }: ListUserParams) {
    try {
      const offset = (page - 1) * limit;

      // --- Build filters ---
      const filters = [];

      // Keyword search (applies on multiple fields)
      if (search) {
        filters.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.mobile, `%${search}%`)
          )
        );
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      // --- Query ---
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          mobile: users.mobile,
          active: users.active,
          allow_login: users.allow_login,
          created_at: users.created_at,
        })
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${users.created_at} DESC`);

      // --- Total count ---
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
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

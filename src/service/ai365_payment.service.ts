import { db } from "../config/database";
import { payment } from "../db/schema/ai365_payment";
import { eq, InferInsertModel } from "drizzle-orm";

type CreatePaymentInput = InferInsertModel<typeof payment>;

export class PaymentService {
  static async createPayment(data: CreatePaymentInput) {
    const [result] = await db
      .insert(payment)
      .values({
        txnid: data.txnid,
        plan: data.plan,
        price: data.price,
        userId: data.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        mode: data.mode ?? null,
      })
      .returning();

    return result;
  }

  static async updatePaymentStatus(
    txnid: string,
    status: string,
    mode?: string,
  ) {
    const [result] = await db
      .update(payment)
      .set({
        status,
        mode: mode ?? null,
        updated_at: new Date(),
      })
      .where(eq(payment.txnid, txnid))
      .returning();

    return result;
  }

  //   // ✅ Get all payments for a user
  //   async getPaymentsByUser(userId: string) {
  //     return db
  //       .select()
  //       .from(registration)
  //       .where(eq(registration.userId, userId))
  //       .orderBy(desc(registration.createdAt));
  //   }

  //   // ✅ Get payment by transaction id
  //   async getPaymentByTxnId(txnid: string) {
  //     const [payment] = await db
  //       .select()
  //       .from(registration)
  //       .where(eq(registration.txnid, txnid));

  //     return payment;
  //   }
}

import { db } from "../config/database";
import { payment } from "../db/schema/ai365_payment";
import { eq, InferInsertModel } from "drizzle-orm";
import { rzpPayment } from "../db/schema/ai365_rzp_payment";
import { rzpSubscription } from "../db/schema/ai365_rzp_subscription";

type CreatePaymentInput = InferInsertModel<typeof payment>;
type CreateRzpPaymentInput = InferInsertModel<typeof rzpPayment>;
type CreateRzpSubscriptionInput = InferInsertModel<typeof rzpSubscription>;

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

  static async findPaymentByTxnid(txnid: string) {
    const [result] = await db
      .select()
      .from(payment)
      .where(eq(payment.txnid, txnid));

    return result || null;
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

  static async createRzpPayment(data: CreateRzpPaymentInput) {
    const [result] = await db
      .insert(rzpPayment)
      .values({
        subscriptionId: data.subscriptionId,
        plan: data.plan,
        amount: data.amount,
        userId: data.userId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
      })
      .returning();

    return result;
  }

  static async craeteRzpSubscription(data: CreateRzpSubscriptionInput) {
    const [result] = await db
      .insert(rzpSubscription)
      .values({
        planId: data.planId,
        subscriptionId: data.subscriptionId,
        subscriptionStatus: data.subscriptionStatus,
        currentStart: data.currentStart,
        currentEnd: data.currentEnd,
        plan: data.plan,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        userId: data.userId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        paymentId: data.paymentId,
        paymentStatus: data.paymentStatus,
      })
      .returning();
    return result;
  }
}

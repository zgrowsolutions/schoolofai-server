import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../service/ai365_payment.service";
import { SubscriptionsService } from "../service/ai365_subscriptions.service";
import dayjs from "dayjs";
import { createPayment } from "../lib/payment";
import createHttpError from "http-errors";
import { UserService } from "../service/ai365_user.service";
import appEvents from "../events/app.events";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { config } from "../config/env";

async function RunSubscriptionTasks(req: Request) {
  const body = req.body;
  const userId = body.payload.subscription.entity.notes.userId;
  const name = body.payload.subscription.entity.notes.name;
  const email = body.payload.subscription.entity.notes.email;
  const plan = body.payload.subscription.entity.notes.plan;
  const isNew = body.payload.subscription.entity.notes.isNew;
  const amount = body.payload.payment.entity.amount / 100;

  PaymentService.craeteRzpSubscription({
    planId: body.payload.subscription.entity.plan_id,
    subscriptionId: body.payload.subscription.entity.id,
    subscriptionStatus: body.payload.subscription.entity.status,
    currentStart: body.payload.subscription.entity.current_start,
    currentEnd: body.payload.subscription.entity.current_end,
    plan,
    amount: String(amount),
    currency: body.payload.payment.entity.currency,
    method: body.payload.payment.entity.method,
    userId,
    name,
    email,
    mobile: body.payload.subscription.entity.notes.mobile,
    paymentId: body.payload.payment.entity.id,
    paymentStatus: body.payload.payment.entity.status,
  });

  if (isNew === "1") {
    await UserService.moveUserFromTemp(userId);
    const userdata = {
      name,
      email,
    };
    appEvents.emit("user_registered", userdata);
  }

  const now = dayjs();

  let endDate = now.toDate();
  if (plan === "monthly") {
    endDate = now.add(1, "month").toDate();
  } else if (plan === "annual") {
    endDate = now.add(1, "year").toDate();
  }

  SubscriptionsService.create({
    userId: userId,
    plan: plan as "annual" | "monthly",
    status: "active",
    price: Number(amount),
    isTrial: false,
    startDate: now.toDate(),
    endDate: endDate,
  });
}

export const InitiatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { plan } = req.body;
    if (!userId) throw createHttpError[400]("User not found");
    const payment_url = await createPayment({
      plan,
      userId,
      userType: "EXISTING_USER",
    });

    res.json({ payment_url });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const EasebuzzHook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, txnid, mode, udf1 } = req.body;

    if (status !== "success") return res.sendStatus(200);

    await PaymentService.updatePaymentStatus(txnid, status, mode);
    const payment = await PaymentService.findPaymentByTxnid(txnid);

    if (udf1 === "NEW_USER") {
      await UserService.moveUserFromTemp(payment.userId);
      const userdata = {
        name: payment.name,
        email: payment.email,
      };

      appEvents.emit("user_registered", userdata);
    }

    const now = dayjs();

    let endDate = now.toDate();
    if (payment?.plan === "monthly") {
      endDate = now.add(1, "month").toDate();
    } else if (payment?.plan === "annual") {
      endDate = now.add(1, "year").toDate();
    }

    SubscriptionsService.create({
      userId: payment.userId,
      plan: payment.plan as "annual" | "monthly",
      status: "active",
      price: Number(payment.price),
      isTrial: false,
      startDate: now.toDate(),
      endDate: endDate,
    });

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const RzpHook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body;

    const hookSignature = req.headers["x-razorpay-signature"] as string;
    const isValid = validateWebhookSignature(
      JSON.stringify(body),
      hookSignature,
      config.rzp_hook_secret,
    );
    if (!isValid) return res.sendStatus(200);

    // console.log(JSON.stringify(body, null, 4));

    if (body.event === "subscription.charged") {
      await RunSubscriptionTasks(req);
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(200);
  }
};

import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../service/ai365_payment.service";
import { SubscriptionsService } from "../service/ai365_subscriptions.service";
import dayjs from "dayjs";
import { createPayment } from "../lib/payment";
import createHttpError from "http-errors";

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
    const { status, txnid, mode } = req.body;

    if (status !== "success") return res.sendStatus(200);

    await PaymentService.updatePaymentStatus(txnid, status, mode);
    const payment = await PaymentService.findPaymentByTxnid(txnid);

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

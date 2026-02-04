import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { sha512 } from "js-sha512";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { URLSearchParams } from "node:url";
import { config } from "../config/env";
import { UserService } from "../service/ai365_user.service";
import { PaymentService } from "../service/ai365_payment.service";
import { SubscriptionsService } from "../service/ai365_subscriptions.service";
import dayjs from "dayjs";

export const InitiatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { plan } = req.body;
    if (plan !== "monthly" && plan !== "annual")
      throw createHttpError[400]("Invalid plan");

    if (!userId) throw createHttpError[400]("User not found");
    const user = await UserService.findUserById(userId);
    if (!user) throw createHttpError[400]("User not found");

    let price = 100;
    if (plan === "monthly") price = 1;
    else if (plan === "annual") price = 2999;

    const txn_id = uuidv4();
    const key = config.easebuzz_key,
      txnid = txn_id,
      amount = price,
      productinfo = "AI365",
      firstname = "Pugazhenthi",
      email = "pugazhonline@gmail.com",
      udf1 = "",
      udf2 = "",
      udf3 = "",
      udf4 = "",
      udf5 = "",
      udf6 = "",
      udf7 = "",
      udf8 = "",
      udf9 = "",
      udf10 = "",
      salt = config.easebuzz_salt;

    const hash_string =
      key +
      "|" +
      txnid +
      "|" +
      amount +
      "|" +
      productinfo +
      "|" +
      firstname +
      "|" +
      email +
      "|" +
      udf1 +
      "|" +
      udf2 +
      "|" +
      udf3 +
      "|" +
      udf4 +
      "|" +
      udf5 +
      "|" +
      udf6 +
      "|" +
      udf7 +
      "|" +
      udf8 +
      "|" +
      udf9 +
      "|" +
      udf10 +
      "|" +
      salt;
    const hash = sha512(hash_string);

    const callbackurl = `${config.server_url}/ai365/hooks/easebuzz/callback`;

    const encodedParams = new URLSearchParams();
    encodedParams.set("key", config.easebuzz_key);
    encodedParams.set("txnid", txnid);
    encodedParams.set("amount", String(amount));
    encodedParams.set("productinfo", productinfo);
    encodedParams.set("firstname", firstname);
    encodedParams.set("phone", String(9976412129));
    encodedParams.set("email", email);
    encodedParams.set("surl", callbackurl);
    encodedParams.set("furl", callbackurl);
    encodedParams.set("hash", hash);

    const url =
      config.easebuzz_env === "live"
        ? "https://pay.easebuzz.in/payment/initiateLink"
        : "https://testpay.easebuzz.in/payment/initiateLink";

    const { data } = await axios.post(url, encodedParams, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    });

    if (data.status !== 1) {
      console.log(data);
      throw createHttpError.InternalServerError("Unable to handle request");
    }

    await PaymentService.createPayment({
      userId: user.id,
      txnid: txnid,
      plan: plan,
      price: String(amount),
      name: user.name,
      email: user.email,
      phone: user.mobile,
      status: "initiated",
      mode: null,
    });

    const payment_url =
      config.easebuzz_env === "live"
        ? `https://pay.easebuzz.in/pay/${data.data}`
        : `https://testpay.easebuzz.in/pay/${data.data}`;

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

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

type PlanProps = "monthly" | "annual";
interface GetHashProps {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  udf6: string;
  udf7: string;
  udf8: string;
  udf9: string;
  udf10: string;
  salt: string;
}

const get_price = (plan: PlanProps): number | false => {
  const MONTHLY_PRICE = 299;
  const ANNUAL_PRICE = 2999;
  if (plan === "monthly") return MONTHLY_PRICE;
  if (plan === "annual") return ANNUAL_PRICE;
  return false;
};

const getHash = (data: GetHashProps) => {
  const hash_string = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|${data.udf1}|${data.udf2}|${data.udf3}|${data.udf4}|${data.udf5}|${data.udf6}|${data.udf7}|${data.udf8}|${data.udf9}|${data.udf10}|${data.salt}`;
  return sha512(hash_string);
};

export const InitiatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { plan } = req.body;

    const price = get_price(plan);
    if (!price) throw createHttpError[400]("Invalid plan");
    if (!userId) throw createHttpError[400]("User not found");

    const user = await UserService.findUserById(userId);
    if (!user) throw createHttpError[400]("User not found");

    const txn_id = uuidv4();

    const hashData = {
      key: config.easebuzz_key,
      txnid: txn_id,
      amount: String(price),
      productinfo: "AI365",
      firstname: user.name,
      email: user.email,
      udf1: "",
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
      udf6: "",
      udf7: "",
      udf8: "",
      udf9: "",
      udf10: "",
      salt: config.easebuzz_salt,
    };

    const callbackurl = `${config.server_url}/ai365/hooks/easebuzz/callback`;

    const encodedParams = new URLSearchParams();
    encodedParams.set("key", hashData.key);
    encodedParams.set("txnid", hashData.txnid);
    encodedParams.set("amount", hashData.amount);
    encodedParams.set("productinfo", hashData.productinfo);
    encodedParams.set("firstname", hashData.firstname);
    encodedParams.set("phone", user.mobile);
    encodedParams.set("email", hashData.email);
    encodedParams.set("surl", callbackurl);
    encodedParams.set("furl", callbackurl);
    encodedParams.set("hash", getHash(hashData));

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
      txnid: hashData.txnid,
      plan: plan,
      price: hashData.amount,
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

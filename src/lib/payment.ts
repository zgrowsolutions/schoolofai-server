import createHttpError from "http-errors";
import { UserService } from "../service/ai365_user.service";
import { TempUserService } from "../service/ai365_temp_user.service";
import { v4 as uuidv4 } from "uuid";
import { sha512 } from "js-sha512";
import { PaymentService } from "../service/ai365_payment.service";
import axios from "axios";
import { URLSearchParams } from "node:url";
import { config } from "../config/env";

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

interface CreatePaymentProps {
  userId: string;
  plan: PlanProps;
  userType: "NEW_USER" | "EXISTING_USER";
}
const get_price = (plan: PlanProps): number | false => {
  const MONTHLY_PRICE = 1;
  const ANNUAL_PRICE = 2999;
  if (plan === "monthly") return MONTHLY_PRICE;
  if (plan === "annual") return ANNUAL_PRICE;
  return false;
};

const getHash = (data: GetHashProps) => {
  const hash_string = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|${data.udf1}|${data.udf2}|${data.udf3}|${data.udf4}|${data.udf5}|${data.udf6}|${data.udf7}|${data.udf8}|${data.udf9}|${data.udf10}|${data.salt}`;
  return sha512(hash_string);
};

export async function createPayment({
  userId,
  plan,
  userType,
}: CreatePaymentProps): Promise<string> {
  try {
    const price = get_price(plan);
    if (!price) throw createHttpError[400]("Invalid plan");

    let user;
    if (userType === "EXISTING_USER") {
      user = await UserService.findUserById(userId);
      if (!user) throw createHttpError[400]("User not found");
    }
    if (userType === "NEW_USER") {
      user = await TempUserService.findUserById(userId);
      if (!user) throw createHttpError[400]("User not found");
    }

    const txn_id = uuidv4();

    const hashData = {
      key: config.easebuzz_key,
      txnid: txn_id,
      amount: String(price),
      productinfo: "AI365",
      firstname: user?.name ?? "",
      email: user?.email ?? "",
      udf1: userType,
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
    encodedParams.set("phone", user?.mobile!);
    encodedParams.set("email", hashData.email);
    encodedParams.set("surl", callbackurl);
    encodedParams.set("furl", callbackurl);
    encodedParams.set("udf1", hashData.udf1);
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
      userId: user?.id ?? "",
      txnid: hashData.txnid,
      plan: plan,
      price: hashData.amount,
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.mobile ?? "",
      status: "initiated",
      mode: null,
    });

    const payment_url =
      config.easebuzz_env === "live"
        ? `https://pay.easebuzz.in/pay/${data.data}`
        : `https://testpay.easebuzz.in/pay/${data.data}`;
    return payment_url;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

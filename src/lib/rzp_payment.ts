import Razorpay from "razorpay";
import { config } from "../config/env";
import { PaymentService } from "../service/ai365_payment.service";

const razorpay = new Razorpay({
  key_id: config.rzp_key_id,
  key_secret: config.rzp_key_secret,
});

interface SubsProps {
  planId: string;
  totalCount: number;
  plan: string;
  amount: number;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  isNew: "1" | "0";
}

export async function createRzpSubscripotion(props: SubsProps) {
  const subscription = await razorpay.subscriptions.create({
    plan_id: props.planId,
    customer_notify: true,
    quantity: 1,
    total_count: props.totalCount,
    notes: {
      isNew: props.isNew,
      userId: props.userId,
      plan: props.plan,
      name: props.name,
      email: props.email,
      mobile: props.mobile,
    },
  });

  return await PaymentService.createRzpPayment({
    subscriptionId: subscription.id,
    plan: props.plan,
    amount: String(props.amount),
    userId: props.userId,
    name: props.name,
    email: props.email,
    mobile: props.mobile,
  });
}

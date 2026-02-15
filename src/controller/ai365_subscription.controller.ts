import { Request, Response, NextFunction } from "express";
import { SubscriptionsService } from "../service/ai365_subscriptions.service";
import createHttpError from "http-errors";

export const MySubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw createHttpError[400]("User not found");
    const data = await SubscriptionsService.findByUserId(userId);
    res.json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const FindAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await SubscriptionsService.findAll();
    res.json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const GetSubscriptionCountByDay = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 15;
    const data = await SubscriptionsService.getSubscriptionCountByDay(days);
    res.json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

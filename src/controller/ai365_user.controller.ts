import { Request, Response, NextFunction } from "express";
import { UserService } from "../service/ai365_user.service";
import { TempUserService } from "../service/ai365_temp_user.service";

import { v4 as uuidv4 } from "uuid";
import createHttpError from "http-errors";
import { createPayment } from "../lib/payment";

export const TempCreate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { plan } = req.body;
    const email_exist = await UserService.findUserByEmail(req.body.email);
    if (email_exist !== null)
      throw createHttpError[400](
        `User with email ${req.body.email} already exist`,
      );
    const mobile_exist = await UserService.findUserByMobile(req.body.mobile);
    if (mobile_exist !== null)
      throw createHttpError[400](
        `User with mobile ${req.body.mobile} already exist`,
      );

    const userId = uuidv4();
    await TempUserService.create({ id: userId, ...req.body });
    const payment_url = await createPayment({
      userId,
      plan,
      userType: "NEW_USER",
    });

    res.json({ payment_url });
  } catch (error) {
    next(error);
  }
};

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await UserService.list({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search as string,
    });
    res.json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const Delete = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    await UserService.delete(id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    await UserService.update(id, req.body);
    res.json({ message: "Updated successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

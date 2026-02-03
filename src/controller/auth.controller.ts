import { Request, Response, NextFunction } from "express";
import { AuthService } from "../service/auth.service";

import createHttpError from "http-errors";

export const Login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userCreadentials = req.body;
    const result = await AuthService.login(userCreadentials);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const Me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createHttpError.Unauthorized("User ID missing in request"));
    }
    const user = await AuthService.me(userId.toString());
    res.json(user);
  } catch (error) {
    next(error);
  }
};

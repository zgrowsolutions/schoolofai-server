import { Request, Response, NextFunction } from "express";
import { AuthService } from "../service/ai365_auth.service";
import { UserService } from "../service/ai365_user.service";
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

export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createHttpError.Unauthorized("User ID missing in request"));
    }
    await UserService.update(userId, req.body);
    res.json({ message: "Updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const RequestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email;
    const result = await AuthService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const ResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId;
    const token = req.body.token;
    const newPassword = req.body.password;
    const result = await AuthService.resetPassword(userId, token, newPassword);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
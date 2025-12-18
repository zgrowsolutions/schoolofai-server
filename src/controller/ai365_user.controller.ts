import { Request, Response, NextFunction } from "express";
import { UserService } from "../service/ai365_user.service";

export const Create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await UserService.create(req.body);
    res.json({ message: "You are registered successfully" });
  } catch (error) {
    next(error);
  }
};

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.list();
    res.json(users);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const Delete = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
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

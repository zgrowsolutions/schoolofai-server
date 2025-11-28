import { Request, Response, NextFunction } from "express";
import { RegistrationService } from "../service/registration.service";

export const Create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await RegistrationService.create(req.body);
    res.json({ message: "Registration completed" });
  } catch (error) {
    next(error);
  }
};

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await RegistrationService.list({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search as string,
      course: req.query.course as string,
      campaign: req.query.campaign as string,
    });

    res.json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const GetCourseOrcampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = req.query.filter as "course" | "campaign";

    if (!["course", "campaign"].includes(filter)) {
      throw new Error("Invalid argument");
    }

    const data = await RegistrationService.getCourseOrCampaign(filter);

    res.json(data);
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
    await RegistrationService.delete(parseInt(id));
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

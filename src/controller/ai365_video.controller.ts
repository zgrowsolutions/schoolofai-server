import { Request, Response, NextFunction } from "express";
import { VideosService } from "../service/ai365_video.service";

export const Create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await VideosService.create(req.body);

    res.json({
      message: "Video created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const GetAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const videos = await VideosService.findAll();
    res.json(videos);
  } catch (error) {
    next(error);
  }
};

export const GetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const video = await VideosService.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.json(video);
  } catch (error) {
    next(error);
  }
};

export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const video = await VideosService.update(req.params.id, req.body);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.json({
      message: "Video updated successfully",
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

export const Delete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await VideosService.delete(req.params.id);

    res.json({
      message: "Video deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

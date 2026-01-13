import express from "express";
import {
  GetAll,
  GetById,
  Create,
  Update,
  Delete,
} from "../../../controller/ai365_video.controller";

const Router = express.Router();

Router.get("/", GetAll);
Router.get("/:id", GetById);
Router.post("/", Create);
Router.put("/:id", Update);
Router.delete("/:id", Delete);

export default Router;

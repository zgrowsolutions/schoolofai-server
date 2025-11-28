import express from "express";
const Router = express.Router();
import {
  List,
  GetCourseOrcampaign,
} from "../../controller/registration.controller";

Router.get("/", List);
Router.get("/course", GetCourseOrcampaign);

export default Router;

import express from "express";
const Router = express.Router();
import {
  List,
  Download,
  GetCourseOrcampaign,
} from "../../controller/registration.controller";

Router.get("/", List);
Router.get("/download", Download);
Router.get("/course", GetCourseOrcampaign);

export default Router;

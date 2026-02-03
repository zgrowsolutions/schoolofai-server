import express from "express";
import { MySubscription } from "../../controller/ai365_subscription.controller";
import { VideoByUser, GetById } from "../../controller/ai365_video.controller";
const Router = express.Router();

Router.get("/", MySubscription);
Router.get("/video", VideoByUser);
Router.get("/video/:id", GetById);

export default Router;

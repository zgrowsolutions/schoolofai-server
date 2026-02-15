import express from "express";
import { FindAll, GetSubscriptionCountByDay } from "../../../controller/ai365_subscription.controller";

const Router = express.Router();

Router.get("/", FindAll);
Router.get("/count-by-day", GetSubscriptionCountByDay);

export default Router;

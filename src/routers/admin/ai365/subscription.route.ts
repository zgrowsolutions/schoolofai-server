import express from "express";
import { FindAll } from "../../../controller/ai365_subscription.controller";

const Router = express.Router();

Router.get("/", FindAll);

export default Router;

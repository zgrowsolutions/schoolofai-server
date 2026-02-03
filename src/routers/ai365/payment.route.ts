import express from "express";
import { InitiatePayment } from "../../controller/ai365_payment.controller";
const Router = express.Router();

Router.use("/init", InitiatePayment);

export default Router;

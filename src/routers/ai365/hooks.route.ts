import express from "express";
import { EasebuzzHook } from "../../controller/ai365_payment.controller";

const Router = express.Router();

Router.post("/easebuzz", EasebuzzHook);

export default Router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import donorsRouter from "./donors";
import requestsRouter from "./requests";
import verificationsRouter from "./verifications";
import statsRouter from "./stats";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/donors", donorsRouter);
router.use("/requests", requestsRouter);
router.use("/verifications", verificationsRouter);
router.use("/stats", statsRouter);
router.use(storageRouter);

export default router;

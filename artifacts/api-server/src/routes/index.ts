import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import goalsRouter from "./goals";
import checkinsRouter from "./checkins";
import guidanceRouter from "./guidance";
import chakraRouter from "./chakra";
import relationshipsRouter from "./relationships";
import locationsRouter from "./locations";
import libraryRouter from "./library";
import patternsRouter from "./patterns";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(goalsRouter);
router.use(checkinsRouter);
router.use(guidanceRouter);
router.use(chakraRouter);
router.use(relationshipsRouter);
router.use(locationsRouter);
router.use(libraryRouter);
router.use(patternsRouter);
router.use(dashboardRouter);

export default router;

import express from "express";
import dailySummaryRouter from "./dailySummary/dailySummary-router.js";
import userRouter from "./user/user-router.js";
import exerciseRouter  from "./exercise/exercise-router.js";
import exerciseAttemptRouter from "./exerciseAttempts/exerciseAttemps-router.js";
import authRouter from "./auth/auth-routes.js";
import dashboardRouter from "./dashboard/dashboard-routes.js";

const router = express.Router();
router
  .use(dailySummaryRouter)
  .use(userRouter)
  .use(exerciseRouter)
  .use(exerciseAttemptRouter)
  .use(authRouter)
  .use(dashboardRouter)
  .use((error, req, res, next) => {
    res.status(500).send({
      code: error.code,
      message: error.message,
    });
  });

export default router;

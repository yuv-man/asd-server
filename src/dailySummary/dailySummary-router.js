import express from "express";
import { DailySummary } from "./dailySummary-model.js";

const router = express.Router();
const BASE_PATH = "/api/dailySummaries";

router
  .route(BASE_PATH)
  // find all
  .get((req, res, next) => {
    DailySummary.find()
      .lean()
      .then((dailySummaries) => res.send(dailySummaries))
      .catch(next);
  })
  // create new
  .post((req, res, next) => {
    DailySummary.create(req.body)
      .then((dailySummary) => res.send(dailySummary))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/search`)
  // search
  .post((req, res, next) => {
    DailySummary.find(req.body)
      .lean()
      .then((dailySummaries) => res.send(dailySummaries))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/user/:userId`)
  //get all daily summaries for a user
  .get((req, res, next) => {
    DailySummary.find({ userId: req.params.userId })
      .lean()
      .then((dailySummaries) => res.send(dailySummaries))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/user/recent/:userId`)
  //get last week daily summaries for a user
  .get((req, res, next) => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    DailySummary.find({
      userId: req.params.userId,
      date: { $gte: lastWeek },
    })
      .lean()
      .sort({ date: -1 })
      .then((dailySummaries) => res.send(dailySummaries))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/:id`)
  // get one
  .get((req, res, next) => {
    DailySummary.findById(req.params.id)
      .lean()
      .orFail()
      .then((dailySummary) => res.send(dailySummary))
      .catch(next);
  })
  // update
  .put((req, res, next) => {
    DailySummary.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .lean()
      .orFail()
      .then((dailySummary) => res.send(dailySummary))
      .catch(next);
  })
  // delete
  .delete((req, res, next) => {
    DailySummary.findByIdAndDelete(req.params.id)
      .lean()
      .orFail()
      .then(() => res.send(req.params))
      .catch(next);
  });

export default router;

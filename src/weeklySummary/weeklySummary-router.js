import express from "express";
import { WeeklySummary } from "./weeklySummary-model.js";

const router = express.Router();
const BASE_PATH = "/api/weeklySummaries";

router
  .route(BASE_PATH)
  // find all
  .get((req, res, next) => {
    WeeklySummary.find()
      .lean()
      .then((weeklySummaries) => res.send(weeklySummaries))
      .catch(next);
  })
  // create new
  .post((req, res, next) => {
    WeeklySummary.create(req.body)
      .then((weeklySummary) => res.send(weeklySummary))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/search`)
  // search
  .post((req, res, next) => {
    WeeklySummary.find(req.body)
      .lean()
    .then((weeklySummaries) => res.send(weeklySummaries))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/user/:userId`)
  //get all weekly summaries for a user
  .get((req, res, next) => {
    WeeklySummary.find({ userId: req.params.userId })
      .lean()
      .then((weeklySummaries) => res.send(weeklySummaries))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/user/recent/:userId`)
  //get most recent weekly summary for a user
  .get((req, res, next) => {
    WeeklySummary.find({ userId: req.params.userId })
      .lean()
      .sort({ date: -1 }) // Sort by creation date in descending order
      .limit(1) // Get only one document
      .then((weeklySummaries) => res.send(weeklySummaries[0])) // Send the first (and only) result
      .catch(next);
  });

router
  .route(`${BASE_PATH}/:id`)
  // get one
  .get((req, res, next) => {
    WeeklySummary.findById(req.params.id)
      .lean()
      .orFail()
      .then((weeklySummary) => res.send(weeklySummary))
      .catch(next);
  })
  // update
  .put((req, res, next) => {
    WeeklySummary.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .lean()
      .orFail()
      .then((weeklySummary) => res.send(weeklySummary))
      .catch(next);
  })
  // delete
  .delete((req, res, next) => {
    WeeklySummary.findByIdAndDelete(req.params.id)
      .lean()
      .orFail()
      .then(() => res.send(req.params))
      .catch(next);
  });

export default router;

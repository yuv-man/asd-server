import express from "express";
import { ExerciseAttempt } from "./exerciseAttempts-model.js";

const router = express.Router();
const BASE_PATH = "/api/exerciseAttempts";

router
  .route(BASE_PATH)
  // find all
  .get((req, res, next) => {
    ExerciseAttempt.find()
      .lean()
      .then((exerciseAttempts) => res.send(exerciseAttempts))
      .catch(next);
  })

  // get all by user id
  .get((req, res, next) => {
    ExerciseAttempt.find({ userId: req.params.userId })
      .lean()
      .then((exerciseAttempts) => res.send(exerciseAttempts))
      .catch(next);
  })

  // get all by exercise id and user id
  .get((req, res, next) => {
    ExerciseAttempt.find({ exerciseId: req.params.exerciseId, userId: req.params.userId })
      .lean()
      .then((exerciseAttempts) => res.send(exerciseAttempts))
      .catch(next);
  })
  
  // create new
  .post((req, res, next) => {
    ExerciseAttempt.create(req.body)
      .then((exerciseAttempt) => res.send(exerciseAttempt))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/search`)
  // search
  .post((req, res, next) => {
    ExerciseAttempt.find(req.body)
      .lean()
      .then((exerciseAttempts) => res.send(exerciseAttempts))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/:id`)
  // get one
  .get((req, res, next) => {
    ExerciseAttempt.findById(req.params.id)
      .lean()
      .orFail()
      .then((exerciseAttempt) => res.send(exerciseAttempt))
      .catch(next);
  })
  // update
  .put((req, res, next) => {
    ExerciseAttempt.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .lean()
      .orFail()
      .then((exerciseAttempt) => res.send(exerciseAttempt))
      .catch(next);
  })
  // delete
  .delete((req, res, next) => {
    ExerciseAttempt.findByIdAndDelete(req.params.id)
      .lean()
      .orFail()
      .then(() => res.send(req.params))
      .catch(next);
  });

export default router;

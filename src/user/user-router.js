import express from "express";
import { User } from "./user-model.js";
import authenticateToken from "../auth/auth-middleware.js";

const router = express.Router();
const BASE_PATH = "/api/profile";

router
  .route(BASE_PATH)
  // create new
  .post((req, res, next) => {
    User.create(req.body)
      .then((user) => res.send(user))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/:id`)
  // get one
  .get(authenticateToken, (req, res, next) => {
    if (req.params.id !== req.user.id) {
      return res.status(403).send({ message: 'Not authorized to access this profile' });
    }
    User.findById(req.params.id)
      .lean()
      .select('-password')
      .orFail()
      .then((user) => res.send(user))
      .catch(next);
  })
  // update
  .put((req, res, next) => {
    // if (req.params.id !== req.user.id) {
    //   return res.status(403).send({ message: 'Not authorized to modify this profile' });
    // }
    User.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .lean()
      .select('-password')
      .orFail()
      .then((user) => res.send(user))
      .catch(next);
  })
  // delete
  .delete(authenticateToken, (req, res, next) => {
    if (req.params.id !== req.user.id) {
      return res.status(403).send({ message: 'Not authorized to delete this profile' });
    }
    User.findByIdAndDelete(req.params.id)
      .lean()
      .orFail()
      .then(() => res.send(req.params))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/me`)
  // get profile
  .get(authenticateToken, (req, res, next) => {
    User.findById(req.user.id)
      .select('-password')
      .lean()
      .orFail()
      .then((user) => res.send(user))
      .catch(next);
  })
  // update profile
  .put(authenticateToken, (req, res, next) => {
    const { name, age } = req.body;
    User.findByIdAndUpdate(
      req.user.id,
      { name, age },
      { new: true }
    )
      .select('-password')
      .lean()
      .orFail()
      .then((user) => res.send(user))
      .catch(next);
  });

export default router;

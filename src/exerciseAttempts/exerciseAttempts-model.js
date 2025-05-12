import { model } from "../db.js";
import { registerNotificationEvents } from "../notify.js";
import mongoose from "mongoose";
// name
const modelName = "ExerciseAttempt";

const exerciseAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    difficultyLevel: { type: Number, required: true },
    score: Number,
    area: {
      type: String,
      required: true,
      enum: ["ot", "speech", "cognitive"]
    },
    isTest: { type: Boolean, default: false },
    metrics: {
      timeSpentSeconds: Number,
      attemptsCount: Number,
      accuracy: Number,
    },
    notes: String
  });

  registerNotificationEvents(modelName, exerciseAttemptSchema)

  export const ExerciseAttempt = model(modelName, exerciseAttemptSchema);
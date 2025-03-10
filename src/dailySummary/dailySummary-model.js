import { model } from "../db.js";
import { registerNotificationEvents } from "../notify.js";
import mongoose from "mongoose";

// name
const modelName = "DailySummary";

const dailySummarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    totalTimeSpentMinutes: { type: Number, default: 0 },
    exercisesCompleted: { type: Number, default: 0 },
    exerciseAttempts: { type: Number, default: 0 },
    areaBreakdown: {
      occupationalTherapy: {
        timeSpentMinutes: { type: Number, default: 0 },
        exercisesCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
      },
      speechTherapy: {
        timeSpentMinutes: { type: Number, default: 0 },
        exercisesCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
      },
      cognitive: {
        timeSpentMinutes: { type: Number, default: 0 },
        exercisesCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
      }
    },
    recentExercises: [{
      exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
      title: String,
      area: String,
      difficultyLevel: Number,
      score: Number,
      timestamp: Date
    }]
  });

  registerNotificationEvents(modelName, dailySummarySchema)

  export const DailySummary = model(modelName, dailySummarySchema);
import { model } from "../db.js";
import { registerNotificationEvents } from "../notify.js";
import mongoose from "mongoose";
// name
const modelName = "Exercise";

const exerciseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    area: { 
      type: String, 
      required: true,
      enum: ["occupationalTherapy", "speechTherapy", "cognitive"]
    },
    type: String,
    difficultyLevels: [{
      level: Number,
      parameters: mongoose.Schema.Types.Mixed,
      passingScore: Number
    }],
    instructions: String,
    imageUrl: String,
    isTest: { type: Boolean, default: false },
    estimatedTimeMinutes: Number,
    skills: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  registerNotificationEvents(modelName, exerciseSchema)

    export const Exercise = model(modelName, exerciseSchema);
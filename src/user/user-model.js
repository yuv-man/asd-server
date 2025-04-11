import { model } from "../db.js";
import { registerNotificationEvents } from "../notify.js";
import mongoose from "mongoose";

// name
const modelName = "User";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    avatarUrl: { type: String },
    email: { 
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    parentPhone: { type: String },
    password: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ['supervisor', 'student'],
      default: 'student'
    },
    googleAuth: {
      type: Boolean,
      default: false
    },
    authProviderId: {
      type: String,
      default: null
    },
    language: { type: String, default: "en" },
    dailyUsage: [{
      date: Date,
      totalTimeSpentMinutes: Number,
      sessionsCount: Number
    }],
    areasProgress: {
      ot: {
        enabled: { type: Boolean, default: true },
        difficultyLevel: {type: Number, default: 1},
        overallScore: { type: Number, default: 0 },
        exercisesCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        lastActivity: Date
      },
      speech: {
        enabled: { type: Boolean, default: true },
        difficultyLevel: {type: Number, default: 1},
        overallScore: { type: Number, default: 0 },
        exercisesCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        lastActivity: Date
      },
      cognitive: {
        enabled: { type: Boolean, default: true },
        difficultyLevel: {type: Number, default: 1},
        overallScore: { type: Number, default: 0 },
        exercisesCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        lastActivity: Date
      }
    },
    numOfExercises: { type: Number, default: 3 },
    stars: { type: Number, default: 0 }
  });

  registerNotificationEvents(modelName, userSchema)

  export const User = model(modelName, userSchema);
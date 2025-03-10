import express from "express";
import { Exercise } from "./exercise-model.js";
import authenticateToken from "../auth/auth-middleware.js";
import { io } from "../server.js";
import { ExerciseAttempt } from "../exerciseAttempts/exerciseAttempts-model.js";
import { User } from "../user/user-model.js";
import { DailySummary } from "../dailySummary/dailySummary-model.js";
const router = express.Router();
const BASE_PATH = "/api/exercises";
const SESSION_LENGTH = 3

router
  .route(BASE_PATH)
  // find all
  .get((req, res, next) => {
    Exercise.find()
      .lean()
      .then((exercises) => res.send(exercises))
      .catch(next);
  })
  // create new
  .post((req, res, next) => {
    Exercise.create(req.body)
      .then((exercise) => res.send(exercise))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/search`)
  // search
  .post((req, res, next) => {
    Exercise.find(req.body)
      .lean()
      .then((exercises) => res.send(exercises))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/areas`)
  .get(async (req, res, next) => {
    try {
      // Get areas from query params, default to all areas if none specified
      const areas = req.query.areas ? req.query.areas.split(',') : ["occupationalTherapy", "speechTherapy", "cognitive"];
      
      // Validate areas
      const validAreas = ["occupationalTherapy", "speechTherapy", "cognitive"];
      const filteredAreas = areas.filter(area => validAreas.includes(area.toLowerCase()));
      
      if (filteredAreas.length === 0) {
        return res.status(400).json({ message: 'No valid areas specified' });
      }

      // Calculate how many exercises to get from each area
      const exercisesPerArea = Math.ceil(SESSION_LENGTH / filteredAreas.length);

      // Aggregate pipeline to get random exercises from each area
      const exercises = await Exercise.aggregate([
        // Match exercises from specified areas
        { $match: { area: { $in: filteredAreas } } },
        // Add a random field for sorting
        { $addFields: { random: { $rand: {} } } },
        // Sort by random value
        { $sort: { random: 1 } },
        // Group by area
        { $group: { 
          _id: '$area',
          exercises: { $push: '$$ROOT' }
        }},
        // Get specified number of exercises from each area
        { $project: {
          exercises: { $slice: ['$exercises', exercisesPerArea] }
        }},
        // Unwind the exercises array to flatten the results
        { $unwind: '$exercises' },
        // Return only the exercise fields
        { $replaceRoot: { newRoot: '$exercises' } }
      ]);

      // Ensure we only return SESSION_LENGTH total exercises
      const limitedExercises = exercises.slice(0, SESSION_LENGTH);

      res.json(limitedExercises);
    } catch (error) {
      console.error('Error fetching exercises by areas:', error);
      next(error);
    }
  });

router
  .route(`${BASE_PATH}/limit/:count`)
  .get((req, res, next) => {
    const limit = parseInt(req.params.count) || 3;
    Exercise.find()
      .limit(limit)
      .lean()
      .then((exercises) => res.send(exercises))
      .catch(next);
  });

router
  .route(`${BASE_PATH}/:id`)
  // get one
  .get((req, res, next) => {
    Exercise.findById(req.params.id)
      .lean()
      .orFail()
      .then((exercise) => res.send(exercise))
      .catch(next);
  })
  // update
  .put((req, res, next) => {
    Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .lean()
      .orFail()
      .then((exercise) => res.send(exercise))
      .catch(next);
  })
  // delete
  .delete((req, res, next) => {
    Exercise.findByIdAndDelete(req.params.id)
      .lean()
      .orFail()
      .then(() => res.send(req.params))
      .catch(next);
  });

router.post(`${BASE_PATH}/attempt`, authenticateToken, async (req, res, next) => {
  try {
    const { exerciseId, difficultyLevel, score, area, isTest, metrics, completionStatus, endTime } = req.body;
    
    // Create new attempt
    const newAttempt = new ExerciseAttempt({
      userId: req.user.id,
      exerciseId,
      difficultyLevel,
      score,
      area,
      isTest,
      metrics,
      completionStatus,
      endTime: endTime || new Date()
    });
    
    await newAttempt.save();
    
    // Update user area progress
    const user = await User.findById(req.user.id);
    
    if (user && completionStatus === 'completed') {
      // Update area-specific stats
      const areaStats = user.areasProgress[area];
      const oldTotal = areaStats.overallScore * areaStats.exercisesCompleted;
      areaStats.exercisesCompleted += 1;
      areaStats.overallScore = (oldTotal + score) / areaStats.exercisesCompleted;
      areaStats.lastActivity = new Date();
      
      await user.save();
      
      // Update or create daily summary
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let dailySummary = await DailySummary.findOne({
        userId: req.user.id,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (!dailySummary) {
        dailySummary = new DailySummary({
          userId: req.user.id,
          date: today
        });
      }
      
      // Update summary stats
      const timeSpent = (metrics?.timeSpentSeconds || 0) / 60; // Convert to minutes
      dailySummary.totalTimeSpentMinutes += timeSpent;
      dailySummary.exerciseAttempts += 1;
      
      if (completionStatus === 'completed') {
        dailySummary.exercisesCompleted += 1;
      }
      
      // Update area-specific stats in daily summary
      const areaSummary = dailySummary.areaBreakdown[area];
      areaSummary.timeSpentMinutes += timeSpent;
      
      if (completionStatus === 'completed') {
        const oldAvg = areaSummary.averageScore * areaSummary.exercisesCompleted || 0;
        areaSummary.exercisesCompleted += 1;
        areaSummary.averageScore = (oldAvg + score) / areaSummary.exercisesCompleted;
      }
      
      // Add to recent exercises
      const exercise = await Exercise.findById(exerciseId);
      if (exercise) {
        dailySummary.recentExercises.push({
          exerciseId,
          title: exercise.title,
          area,
          difficultyLevel,
          score,
          timestamp: new Date()
        });
        
        // Keep only the 10 most recent exercises
        if (dailySummary.recentExercises.length > 10) {
          dailySummary.recentExercises.sort((a, b) => b.timestamp - a.timestamp);
          dailySummary.recentExercises = dailySummary.recentExercises.slice(0, 10);
        }
      }
      
      await dailySummary.save();
      
      // Emit real-time update through Socket.IO
      io.to(req.user.id).emit('exercise-completed', {
        exerciseId,
        score,
        area
      });
    }
    
    res.status(201).json({ message: 'Exercise attempt recorded successfully' });
  } catch (error) {
    console.error('Error recording exercise attempt:', error);
    next(error);
  }
});

// Get user attempt history for an exercise
router.get(`${BASE_PATH}/history/:exerciseId`, authenticateToken, async (req, res, next) => {
  try {
    const attempts = await ExerciseAttempt.find({
      userId: req.user.id,
      exerciseId: req.params.exerciseId
    }).sort({ startTime: -1 });
    
    res.json(attempts);
  } catch (error) {
    console.error('Error fetching attempt history:', error);
    next(error);
  }
});

export default router;

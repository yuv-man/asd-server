import express from "express";
import { Exercise } from "./exercise-model.js";
import authenticateToken from "../auth/auth-middleware.js";
import { io } from "../server.js";
import { ExerciseAttempt } from "../exerciseAttempts/exerciseAttempts-model.js";
import { User } from "../user/user-model.js";
import { DailySummary } from "../dailySummary/dailySummary-model.js";
import { WeeklySummary } from "../weeklySummary/weeklySummary-model.js";
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
      const areas = req.query.areas ? req.query.areas.split(',') : ["ot", "speech", "cognitive"];
      
      // Validate areas
      const validAreas = ["ot", "speech", "cognitive"];
      const filteredAreas = areas.filter(area => validAreas.includes(area.toLowerCase()));
      
      if (filteredAreas.length === 0) {
        return res.status(400).json({ message: 'No valid areas specified' });
      }

      // Calculate how many exercises to get from each area
      const exercisesPerArea = Math.ceil(SESSION_LENGTH / filteredAreas.length);

      // Aggregate pipeline to get random exercises from each area
      const exercises = await Exercise.aggregate([
        { $match: { area: { $in: filteredAreas } } },
        // Sample random documents from each area
        { $sample: { size: exercisesPerArea * filteredAreas.length } },
        // Group by area to ensure we have exercises from each area
        { $group: { 
          _id: '$area',
          exercises: { $push: '$$ROOT' }
        }},
        // Get specified number of exercises from each area
        { $project: {
          exercises: { $slice: ['$exercises', exercisesPerArea] }
        }},
        { $unwind: '$exercises' },
        { $replaceRoot: { newRoot: '$exercises' } }
      ]);

      // Shuffle the final results before limiting
      const shuffledExercises = exercises
        .sort(() => Math.random() - 0.5)
        .slice(0, SESSION_LENGTH);

      res.json(shuffledExercises);
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

router.post(`${BASE_PATH}/attempt`, async (req, res, next) => {
  try {
    const { userId, exerciseId, difficultyLevel, score, area, isTest, startTime, endTime, completionStatus='completed' } = req.body;
    
    // Convert string timestamps to Date objects if they aren't already
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    // Create new attempt
    const newAttempt = new ExerciseAttempt({
      userId: userId,
      exerciseId,
      difficultyLevel,
      score,
      area,
      isTest,
      metrics: {},
      startTime: start,
      endTime: end
    });
    
    await newAttempt.save();
    
    // Update user area progress
    const user = await User.findById(userId);
    
    if (user) {
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

      const currentDayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      let dailySummary = await DailySummary.findOne({
        userId: userId,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (!dailySummary) {
        dailySummary = new DailySummary({
          userId: userId,
          date: today
        });
      }

      // Update weekly summary
      let weeklySummary = await WeeklySummary.findOne({
        userId: userId,
        date: {
          $gte: startOfWeek,
          $lt: endOfWeek
        }
      });

      if (!weeklySummary) {
        weeklySummary = new WeeklySummary({
          userId: userId,
          date: today
        }); 
      }
      
      // Update summary stats
      const timeSpent = (end - start) / (1000 * 60); // Convert milliseconds to minutes
      dailySummary.totalTimeSpentMinutes += timeSpent;
      dailySummary.exerciseAttempts += 1;
      weeklySummary.totalTimeSpentMinutes += timeSpent;
      weeklySummary.exerciseAttempts += 1;
      
      
      dailySummary.exercisesCompleted += 1;
      weeklySummary.exercisesCompleted += 1;
      
      
      // Update area-specific stats in daily summary
      const areaSummary = dailySummary.areaBreakdown[area];
      areaSummary.timeSpentMinutes += timeSpent;
      
      
      const oldAvgDaily = areaSummary.averageScore * areaSummary.exercisesCompleted || 0;
      areaSummary.exercisesCompleted += 1;
      areaSummary.averageScore = (oldAvgDaily + score) / areaSummary.exercisesCompleted;
      
      
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

        // Update weekly summary
        weeklySummary.recentExercises.push({
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

        if (weeklySummary.recentExercises.length > 20) {
          weeklySummary.recentExercises.sort((a, b) => b.timestamp - a.timestamp);
          weeklySummary.recentExercises = weeklySummary.recentExercises.slice(0, 10);
        }
      }

      // Update area-specific stats in weekly summary
      const weeklyAreaSummary = weeklySummary.areaBreakdown[area];
      weeklyAreaSummary.timeSpentMinutes += timeSpent;
      
      const oldAvgWeekly = weeklyAreaSummary.averageScore * weeklyAreaSummary.exercisesCompleted || 0;
      weeklyAreaSummary.exercisesCompleted += 1;
      weeklyAreaSummary.averageScore = (oldAvgWeekly + score) / weeklyAreaSummary.exercisesCompleted;
      
      
      await dailySummary.save();
      await weeklySummary.save();

      // Emit real-time update through Socket.IO
      io.to(userId).emit('exercise-completed', {
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

import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();
import authenticateToken from '../auth/auth-middleware.js';
import { DailySummary } from '../dailySummary/dailySummary-model.js';
import { User } from '../user/user-model.js';
import { ExerciseAttempt } from '../exerciseAttempts/exerciseAttempts-model.js';
const BASE_PATH = "/api/dashboard";

// Get user's daily summaries for dashboard
router.get('/daily-summaries', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const summaries = await DailySummary.find({
      userId: req.user.id,
      date: { $gte: startDate }
    }).sort({ date: -1 });
    
    res.json(summaries);
  } catch (error) {
    console.error('Error fetching daily summaries:', error);
    res.status(500).json({ message: 'Server error while fetching summaries' });
  }
});

// Get user's progress in each area
router.get('/area-progress', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.areasProgress);
  } catch (error) {
    console.error('Error fetching area progress:', error);
    res.status(500).json({ message: 'Server error while fetching progress' });
  }
});

// Get improvement over time for a specific area
router.get('/improvement/:area', authenticateToken, async (req, res) => {
  try {
    const { area } = req.params;
    const { days = 90 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const results = await ExerciseAttempt.aggregate([
      { 
        $match: { 
          userId: mongoose.Types.ObjectId(req.user.id),
          area,
          startTime: { $gte: startDate },
          completionStatus: 'completed'
        } 
      },
      { $sort: { startTime: 1 } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
          },
          averageScore: { $avg: '$score' },
          exercisesCompleted: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching improvement data:', error);
    res.status(500).json({ message: 'Server error while fetching improvement data' });
  }
});

// Get recent activity
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const attempts = await ExerciseAttempt.find({
      userId: req.user.id
    })
    .sort({ startTime: -1 })
    .limit(20)
    .populate('exerciseId', 'title area');
    
    res.json(attempts);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Server error while fetching activity' });
  }
});

export default router; 
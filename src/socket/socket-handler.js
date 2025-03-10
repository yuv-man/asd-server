import jwt from 'jsonwebtoken';
import { User } from '../user/user-model.js';

function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Authenticate socket connection
    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        socket.join(decoded.id); // Join a room with the user's ID
        console.log(`User ${decoded.id} authenticated on socket`);
      } catch (error) {
        console.error('Socket authentication error:', error);
      }
    });
    
    // Real-time session tracking
    socket.on('session-start', async (data) => {
      try {
        const { userId } = data;
        // Could update user's session state in the database
        io.to(userId).emit('session-started', { timestamp: new Date() });
      } catch (error) {
        console.error('Session start error:', error);
      }
    });
    
    socket.on('session-end', async (data) => {
      try {
        const { userId, duration } = data;
        // Update user's daily usage
        const user = await User.findById(userId);
        if (user) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let dailyUsageEntry = user.dailyUsage.find(entry => {
            return entry.date.getTime() === today.getTime();
          });
          
          if (!dailyUsageEntry) {
            user.dailyUsage.push({
              date: today,
              totalTimeSpentMinutes: duration / 60, // Convert seconds to minutes
              sessionsCount: 1
            });
          } else {
            dailyUsageEntry.totalTimeSpentMinutes += duration / 60;
            dailyUsageEntry.sessionsCount += 1;
          }
          
          await user.save();
        }
      } catch (error) {
        console.error('Session end error:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}

export default initializeSocket; 
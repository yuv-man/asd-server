import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../user/user-model.js';

const router = express.Router();
const BASE_PATH = '/api/auth';

// Register endpoint
router.post(`${BASE_PATH}/register`, async (req, res) => {
  try {
    const { name,
      age,
      avatarUrl,
      lastLogin,
      language,
      googleAuth,
      authProviderId,
      email,
      dailyUsage,
      areasProgress,
      authProvider } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new user without password
    const newUser = new User({
      name,
      age,
      email,
      parentPhone,
      avatarUrl,
      lastLogin,
      language,
      googleAuth,
      authProviderId,
      dailyUsage,
      areasProgress
    });
    
    await newUser.save();
    
    // Generate JWT token for the new user
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Check authentication status endpoint
router.get('/check-auth', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ isAuthenticated: false });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ isAuthenticated: false });
    }

    res.json({
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ isAuthenticated: false });
  }
});

// User sync endpoint for NextAuth.js OAuth
router.post(`${BASE_PATH}/sync`, async (req, res) => {
  try {
    const { email, name, providerId, provider } = req.body;

    if (!email || !providerId || !provider) {
      return res.status(400).json({ message: 'Missing required user information' });
    }

    let user = await User.findOne({ email: email });

    if (user) {
      // Update existing user
      user.provider = provider;
      user.providerId = providerId;
      user.lastLogin = new Date();

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isExistingUser: true
        },
        token
      });
    } else {
      // User not found, return success but indicate it's a new user
      return res.json({
        success: true,
        user: {
          email,
        }
      });
    }
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ message: 'Server error during user sync' });
  }
});

export default router;
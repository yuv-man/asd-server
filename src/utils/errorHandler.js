// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Default error status and message
    const status = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(status).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  };
  
  // Custom error with status code
  export const AppError = class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);
    }
  };
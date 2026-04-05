import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import * as Sentry from '@sentry/node';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { specs } from './config/swagger.js';
import { logger } from './utils/logger.js';
import { requestLogger, logErrorContext } from './middlewares/loggingMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initializeScheduledJobs } from './utils/scheduledJobs.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import branchRoutes from './routes/branch.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import branchManagerRoutes from './routes/branchManager.routes.js';

dotenv.config();

const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
}

if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
    console.error('Invalid MONGO_URI: Must start with mongodb:// or mongodb+srv://');
    process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET is too short. Use at least 32 characters for production');
}

// Validate external service credentials
const resendFallback = !process.env.RESEND_API_KEY && process.env.SENDGRID_API_KEY;
if (resendFallback) {
    logger.warn('Using deprecated SENDGRID_API_KEY for Resend configuration. Please migrate to RESEND_API_KEY.');
}

const externalServices = {
    RESEND_API_KEY: { name: 'Resend' },
    TWILIO_ACCOUNT_SID: { name: 'Twilio Account SID' },
    TWILIO_AUTH_TOKEN: { name: 'Twilio Auth Token' },
    CLOUD_NAME: { name: 'Cloudinary Cloud Name' },
    CLOUD_API_KEY: { name: 'Cloudinary API Key' },
    CLOUD_API_SECRET: { name: 'Cloudinary API Secret' }
};

const missingServices = Object.entries(externalServices)
    .filter(([key]) => {
        if (key === 'RESEND_API_KEY' && resendFallback) {
            return false;
        }
        return !process.env[key];
    })
    .map(([_, config]) => config.name);

if (missingServices.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`Missing required service credentials: ${missingServices.join(', ')}`);
    process.exit(1);
} else if (missingServices.length > 0) {
    logger.warn(`⚠️  Missing service credentials (non-critical in development): ${missingServices.join(', ')}`);
}

if (process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({
                request: true,
                serverName: true,
                version: true
            })
        ]
    });
}

const app = express();

// Sentry request handler
if (process.env.NODE_ENV === 'production') {
    app.use(Sentry.Handlers.requestHandler());
}

// Security Middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.'
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use(requestLogger);

// CORS configuration 
const corsOrigin = process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || 'https://klean-app.vercel.app', 'http://localhost:5173')
    : process.env.CORS_ORIGIN || '*';

app.use(cors({
    origin: corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request timeout middleware
app.use((req, res, next) => {
    req.setTimeout(parseInt(process.env.REQUEST_TIMEOUT || '30000'));
    res.setTimeout(parseInt(process.env.REQUEST_TIMEOUT || '30000'));
    next();
});

// Health check route
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});

// Swagger Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    swaggerOptions: {
        url: '/api/v1/docs.json'
    }
}));

// Swagger JSON endpoint
app.get('/api/v1/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

// Connect to database
connectDB();

// Initialize scheduled jobs
initializeScheduledJobs();

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/branch', branchRoutes);
app.use('/api/v1/branch-managers', branchManagerRoutes);

// HR Management Routes
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/leaves', leaveRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error logging middleware
app.use(logErrorContext);

// Sentry error handler 
if (process.env.NODE_ENV === 'production') {
    app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port http://localhost:${PORT}`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    logger.warn(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
        logger.info('HTTP server closed');
    });
    
    try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed');
    } catch (err) {
        logger.error('Error closing MongoDB connection:', err.message);
    }
    
    setTimeout(() => {
        logger.error('Forceful shutdown triggered after 10 seconds');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default app;
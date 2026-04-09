import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from '../routes/auth.routes.js';
import { errorHandler } from '../middlewares/errorHandler.js';
import { requestLogger } from '../middlewares/loggingMiddleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const createTestServer = () => {
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors({
        origin: '*',
        credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use(limiter);

    // Request logging
    app.use(requestLogger);

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Health check
    app.get('/api/v1/health', (req, res) => {
        res.status(200).json({ success: true, message: 'Server is running' });
    });

    // Routes
    app.use('/api/v1/auth', authRoutes);

    // Error handling
    app.use(errorHandler);

    return app;
};
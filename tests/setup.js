import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.test') });

let testDb;

// Setup test database
beforeAll(async () => {
    // Use a unique database name for each test run
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/klean-test';
    const dbName = `klean-test-${Date.now()}`;

    // Connect to MongoDB
    await mongoose.connect(mongoUri);

    // Create a test database
    testDb = mongoose.connection.useDb(dbName);
}, 30000);

afterAll(async () => {
    if (testDb) {
        await testDb.dropDatabase();
    }
    await mongoose.connection.close();
}, 30000);

afterEach(async () => {
    if (testDb) {
        const collections = testDb.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Mock scheduled jobs
jest.mock('../utils/scheduledJobs.js', () => ({
    initializeScheduledJobs: jest.fn()
}));

// Mock Cloudinary
jest.mock('../utils/upload.js', () => ({
    default: (req, res, next) => next()
}));

// Mock SMS and Email services to avoid external API initialization
jest.mock('../utils/smsService.js', () => ({
    smsService: {
        sendWelcomeSMS: jest.fn().mockResolvedValue(true),
        sendLowStockAlertSMS: jest.fn().mockResolvedValue(true),
        sendOrderStatusSMS: jest.fn().mockResolvedValue(true),
        sendOTP: jest.fn().mockResolvedValue(true),
        sendPaymentReminderSMS: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('../utils/emailService.js', () => ({
    emailService: {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
    }
}));

// Mock PDF generation
jest.mock('pdfkit', () => {
    return jest.fn().mockImplementation(() => ({
        fontSize: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        end: jest.fn(),
        pipe: jest.fn()
    }));
});

// Increase test timeout
jest.setTimeout(10000);

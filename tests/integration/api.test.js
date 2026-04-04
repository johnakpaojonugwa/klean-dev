import request from 'supertest';
import express from 'express';
import { logger } from '../../utils/logger.js';

// Mock server setup for integration tests
export const createTestServer = () => {
    const app = express();
    app.use(express.json());
    
    // Health check endpoint for testing
    app.get('/api/v1/health', (req, res) => {
        res.status(200).json({ success: true, message: 'Server is running' });
    });

    return app;
};

describe('API Integration Tests', () => {
    let server;

    beforeAll(() => {
        server = createTestServer();
    });

    describe('Health Check Endpoint', () => {
        it('should return 200 status', async () => {
            const response = await request(server)
                .get('/api/v1/health');

            expect(response.status).toBe(200);
        });

        it('should return success message', async () => {
            const response = await request(server)
                .get('/api/v1/health');

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Server is running');
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(server)
                .get('/api/v1/non-existent');

            expect(response.status).toBe(404);
        });
    });

    describe('Error Handling', () => {
        it('should handle requests with proper content-type', async () => {
            const response = await request(server)
                .get('/api/v1/health')
                .set('Content-Type', 'application/json');

            expect(response.headers['content-type']).toContain('application/json');
        });
    });

    describe('Request Response Cycle', () => {
        it('should complete request-response cycle', async () => {
            const startTime = Date.now();
            const response = await request(server)
                .get('/api/v1/health');
            const duration = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(1000); // Should respond within 1 second
        });
    });
});

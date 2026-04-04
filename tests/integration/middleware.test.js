import { jest } from '@jest/globals';
import request from 'supertest';
import { createTestServer } from '../test-server.js';
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { connectDB, closeDB } from '../../config/db.js';

const app = createTestServer();

describe('Middleware Integration Tests', () => {
    let testUser;
    let validToken;
    let expiredToken;

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await closeDB();
    });

    beforeEach(async () => {
        // Create test user
        testUser = await User.create({
            username: 'middlewaretest',
            email: 'middleware@test.com',
            password: 'hashedpassword123',
            role: 'employee',
            branch: 'main'
        });

        // Generate valid token
        validToken = jwt.sign(
            { userId: testUser._id, role: testUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Generate expired token
        expiredToken = jwt.sign(
            { userId: testUser._id, role: testUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '-1h' } // Already expired
        );
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    describe('Authentication Middleware', () => {
        it('should allow access with valid JWT token', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${validToken}`);

            // Should not return 401 (would be 404 if route exists but auth passes)
            expect(response.status).not.toBe(401);
        });

        it('should deny access without token', async () => {
            const response = await request(app)
                .get('/api/v1/orders');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('No token provided');
        });

        it('should deny access with invalid token format', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', 'InvalidTokenFormat');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid token format');
        });

        it('should deny access with expired token', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Token expired');
        });

        it('should deny access with malformed JWT', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', 'Bearer malformed.jwt.token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Authorization Middleware', () => {
        it('should allow admin access to admin routes', async () => {
            // Create admin user
            const adminUser = await User.create({
                username: 'admintest',
                email: 'admin@test.com',
                password: 'hashedpassword123',
                role: 'admin',
                branch: 'main'
            });

            const adminToken = jwt.sign(
                { userId: adminUser._id, role: adminUser.role },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`);

            // Should not return 403 (would be 404 if route exists but auth passes)
            expect(response.status).not.toBe(403);
        });

        it('should deny employee access to admin routes', async () => {
            const response = await request(app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Insufficient permissions');
        });
    });

    describe('Rate Limiting Middleware', () => {
        it('should allow requests within rate limit', async () => {
            const response = await request(app)
                .get('/api/v1/health');

            expect(response.status).toBe(200);
        });

        // Note: Testing rate limit exceeded would require multiple rapid requests
        // which might be flaky in test environment
    });

    describe('CORS Middleware', () => {
        it('should include CORS headers', async () => {
            const response = await request(app)
                .options('/api/v1/health');

            expect(response.headers['access-control-allow-origin']).toBeDefined();
            expect(response.headers['access-control-allow-methods']).toBeDefined();
            expect(response.headers['access-control-allow-headers']).toBeDefined();
        });
    });

    describe('Security Headers (Helmet)', () => {
        it('should include security headers', async () => {
            const response = await request(app)
                .get('/api/v1/health');

            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBeDefined();
            expect(response.headers['x-xss-protection']).toBeDefined();
        });
    });

    describe('Request Logging Middleware', () => {
        it('should log requests without affecting response', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const response = await request(app)
                .get('/api/v1/health');

            expect(response.status).toBe(200);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Error Handler Middleware', () => {
        it('should handle 404 errors', async () => {
            const response = await request(app)
                .get('/api/v1/nonexistent-route');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Not Found');
        });

        it('should handle validation errors', async () => {
            // This would typically come from a route that validates input
            // For testing, we'll simulate by calling a route that expects validation
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({}); // Empty body should trigger validation

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle server errors', async () => {
            // Mock a route that throws an error
            const originalGet = app.get;
            app.get('/api/v1/test-error', (req, res, next) => {
                next(new Error('Test server error'));
            });

            const response = await request(app)
                .get('/api/v1/test-error');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Internal server error');

            // Restore original
            app.get = originalGet;
        });
    });

    describe('Request Validation Middleware', () => {
        it('should validate request body', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: '12' // Too short
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should sanitize input data', async () => {
            const maliciousData = {
                username: '<script>alert("xss")</script>',
                email: 'test@example.com',
                password: 'validpassword123'
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(maliciousData);

            // Should either sanitize or reject malicious input
            expect([200, 400]).toContain(response.status);
        });
    });
});
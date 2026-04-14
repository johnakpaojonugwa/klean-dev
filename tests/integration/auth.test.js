import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { createTestServer } from '../test-server.js';

const app = createTestServer();

describe('Authentication API', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/v1/auth/sign-up', () => {
        it('should register a new customer successfully', async () => {
            const userData = {
                fullname: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                confirmPassword: 'Password123!'
            };

            const response = await request(app)
                .post('/api/v1/auth/sign-up')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user.email).toBe(userData.email);
        });

        it('should reject registration with invalid email', async () => {
            const userData = {
                fullname: 'John Doe',
                email: 'invalid-email',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                confirmPassword: 'Password123!'
            };

            const response = await request(app)
                .post('/api/v1/auth/sign-up')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Valid email is required');
        });

        it('should reject registration with weak password', async () => {
            const userData = {
                fullname: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                password: 'weak',
                confirmPassword: 'weak'
            };

            const response = await request(app)
                .post('/api/v1/auth/sign-up')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Password must be at least 8 characters with uppercase, number, and special character');
        });

        it('should reject duplicate email registration', async () => {
            const userData = {
                fullname: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                confirmPassword: 'Password123!'
            };

            // First registration
            await request(app)
                .post('/api/v1/auth/sign-up')
                .send(userData)
                .expect(201);

            // Second registration with same email
            const response = await request(app)
                .post('/api/v1/auth/sign-up')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email already registered');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            const user = new User({
                fullname: 'Test User',
                email: 'test@example.com',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                role: 'CUSTOMER'
            });
            await user.save();
        });

        it('should login successfully with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Password123!'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
        });

        it('should reject login with wrong password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword123!'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should reject login with non-existent email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'Password123!'
            };

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
        });
    });

    describe('POST /api/v1/auth/refresh-token', () => {
        let refreshToken;

        beforeEach(async () => {
            // Create a test user and get refresh token
            const user = new User({
                fullname: 'Test User',
                email: 'test@example.com',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                role: 'CUSTOMER'
            });
            await user.save();

            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!'
                });

            refreshToken = loginResponse.body.data.refreshToken;
        });

        it('should refresh tokens successfully', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh-token')
                .send({ refreshToken })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
        });

        it('should reject invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh-token')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid refresh token');
        });
    });
});
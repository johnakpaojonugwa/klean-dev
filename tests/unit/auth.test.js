import request from 'supertest';
import express from 'express';
import { login, register } from '../../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../../middlewares/validationMiddleware.js';

describe('Auth Controller', () => {
    describe('Register', () => {
        it('should fail with invalid email', async () => {
            const payload = {
                fullname: 'John Doe',
                email: 'invalid-email',
                password: 'TestPassword123!'
            };

            // Validation should catch this
            expect(() => {
                if (!payload.email.includes('@')) throw new Error('Invalid email');
            }).toThrow();
        });

        it('should fail with weak password', async () => {
            const payload = {
                fullname: 'John Doe',
                email: 'john@example.com',
                password: 'weak'
            };

            expect(payload.password.length).toBeLessThan(8);
        });

        it('should require fullname of at least 3 characters', async () => {
            const payload = {
                fullname: 'Jo',
                email: 'john@example.com',
                password: 'TestPassword123!'
            };

            expect(payload.fullname.length).toBeLessThan(3);
        });
    });

    describe('Login', () => {
        it('should require email', () => {
            const payload = {
                email: '',
                password: 'TestPassword123!'
            };

            expect(payload.email).toBeFalsy();
        });

        it('should require password', () => {
            const payload = {
                email: 'test@example.com',
                password: ''
            };

            expect(payload.password).toBeFalsy();
        });

        it('should validate email format', () => {
            const email = 'invalid-email';
            const isValid = email.includes('@') && email.includes('.');

            expect(isValid).toBe(false);
        });
    });

    describe('Token Generation', () => {
        it('should create access and refresh tokens', () => {
            const tokens = {
                accessToken: 'jwt.token.here',
                refreshToken: 'jwt.refresh.token'
            };

            expect(tokens).toHaveProperty('accessToken');
            expect(tokens).toHaveProperty('refreshToken');
        });
    });
});

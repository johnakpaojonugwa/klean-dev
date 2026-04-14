import express from 'express';
import { validateRegister, validateLogin } from '../../middlewares/validationMiddleware.js';
import { isValidEmail, isStrongPassword } from '../../utils/validators.js';

describe('Auth Validation Middleware', () => {
    describe('validateRegister', () => {
        let req, res, next;

        beforeEach(() => {
            req = { body: {} };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            next = jest.fn();
        });

        it('should pass with valid registration data', () => {
            req.body = {
                fullname: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                confirmPassword: 'Password123!'
            };

            validateRegister(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject registration with invalid email', () => {
            req.body = {
                fullname: 'John Doe',
                email: 'invalid-email',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                confirmPassword: 'Password123!'
            };

            validateRegister(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.errors).toContain('Valid email is required');
        });

        it('should reject registration with weak password', () => {
            req.body = {
                fullname: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                password: 'weak',
                confirmPassword: 'weak'
            };

            validateRegister(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.errors).toContain('Password must be at least 8 characters with uppercase, number, and special character');
        });

        it('should reject mismatched passwords', () => {
            req.body = {
                fullname: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                confirmPassword: 'Different123!'
            };

            validateRegister(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.errors).toContain('Password and confirm password do not match');
        });

        it('should reject short fullname', () => {
            req.body = {
                fullname: 'Jo',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                password: 'Password123!',
                confirmPassword: 'Password123!'
            };

            validateRegister(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.errors).toContain('Full name must be at least 3 characters');
        });
    });

    describe('validateLogin', () => {
        let req, res, next;

        beforeEach(() => {
            req = { body: {} };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            next = jest.fn();
        });

        it('should pass with valid login credentials', () => {
            req.body = {
                email: 'test@example.com',
                password: 'Password123!'
            };

            validateLogin(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject login with invalid email', () => {
            req.body = {
                email: 'invalid-email',
                password: 'Password123!'
            };

            validateLogin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.errors).toContain('Valid email is required');
        });

        it('should reject login with missing password', () => {
            req.body = {
                email: 'test@example.com',
                password: ''
            };

            validateLogin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.errors).toContain('Password is required');
        });

        it('should reject login with missing email', () => {
            req.body = {
                email: '',
                password: 'Password123!'
            };

            validateLogin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.errors).toContain('Valid email is required');
        });
    });
});

describe('Auth Validators', () => {
    describe('isValidEmail', () => {
        it('should accept valid email addresses', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
        });
    });

    describe('isStrongPassword', () => {
        it('should accept strong passwords', () => {
            expect(isStrongPassword('Password123!')).toBe(true);
            expect(isStrongPassword('SecurePass@456')).toBe(true);
        });

        it('should reject weak passwords', () => {
            expect(isStrongPassword('weak')).toBe(false);
            expect(isStrongPassword('password')).toBe(false);
            expect(isStrongPassword('Pass123')).toBe(false); // missing special char
            expect(isStrongPassword('password123!')).toBe(false); // missing uppercase
        });
    });
});

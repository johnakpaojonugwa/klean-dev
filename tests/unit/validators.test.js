import { isValidEmail, isStrongPassword } from '../../utils/validators.js';

describe('Input Validators', () => {
    describe('Email Validation', () => {
        it('should accept valid email', () => {
            const email = 'user@example.com';
            expect(isValidEmail(email)).toBe(true);
        });

        it('should reject email without @', () => {
            const email = 'userexample.com';
            expect(isValidEmail(email)).toBe(false);
        });

        it('should reject empty email', () => {
            const email = '';
            expect(isValidEmail(email)).toBe(false);
        });

        it('should reject malformed email', () => {
            const email = 'user@.com';
            expect(isValidEmail(email)).toBe(false);
        });
    });

    describe('Password Validation', () => {
        it('should accept strong password', () => {
            const password = 'StrongPass123!';
            expect(isStrongPassword(password)).toBe(true);
        });

        it('should reject password without uppercase', () => {
            const password = 'weakpass123!';
            expect(isStrongPassword(password)).toBe(false);
        });

        it('should reject password without numbers', () => {
            const password = 'WeakPassword!';
            expect(isStrongPassword(password)).toBe(false);
        });

        it('should reject password without special chars', () => {
            const password = 'WeakPass123';
            expect(isStrongPassword(password)).toBe(false);
        });

        it('should reject short password', () => {
            const password = 'Short1!';
            expect(isStrongPassword(password)).toBe(false);
        });
    });
});

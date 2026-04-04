import { jest } from '@jest/globals';
import { sendResponse, sendError } from '../../utils/response.js';

describe('Response Utilities', () => {
    describe('sendResponse', () => {
        it('should format success response correctly', () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            sendResponse(res, 200, true, 'Success', { data: 'test' });

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Success',
                data: { data: 'test' }
            });
        });

        it('should set correct status code', () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            sendResponse(res, 201, true, 'Created', {});

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('sendError', () => {
        it('should format error response correctly', () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            sendError(res, 400, 'Bad Request', ['Field required']);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Bad Request',
                errors: ['Field required']
            });
        });

        it('should handle errors without details', () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            sendError(res, 500, 'Server Error');

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});

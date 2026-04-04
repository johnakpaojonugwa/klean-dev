/**
 * Wrapper to catch async errors in route handlers
 * Ensures all promise rejections are passed to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler that catches errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            // Attach request context for better logging
            error.requestId = req.id;
            error.userId = req.user?.id;
            error.endpoint = `${req.method} ${req.path}`;
            next(error);
        });
    };
};

/**
 * Wrapper for database operations to ensure consistency
 * Automatically rolls back transactions on error
 */
export const withTransaction = (fn) => {
    return asyncHandler(async (req, res, next) => {
        const mongoose = await import('mongoose').then(m => m.default);
        const session = await mongoose.startSession();
        req.session = session;
        
        try {
            session.startTransaction();
            await fn(req, res, next);
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    });
};

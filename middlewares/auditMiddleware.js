import { logger } from '../utils/logger.js';

/**
 * Audit logging for sensitive operations
 * Logs changes to payment status, order status, and financial transactions
 */
export const auditLog = (operationType, description) => {
    return async (req, res, next) => {
        // Store audit info in request for later use
        req.audit = {
            operationType,
            description,
            timestamp: new Date(),
            userId: req.user?.id,
            userRole: req.user?.role,
            branchId: req.user?.branchId,
            ip: req.ip,
            endpoint: `${req.method} ${req.path}`
        };

        // Capture response for logging
        const originalJson = res.json.bind(res);
        res.json = function(data) {
            // Log the audit event
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const auditEvent = {
                    ...req.audit,
                    statusCode: res.statusCode,
                    affectedResource: data?.data?._id || data?.data?.orderId,
                    changes: extractChanges(req.body, operationType)
                };

                logger.info(`[AUDIT] ${operationType}`, auditEvent);

                // You can also persist to AuditLog collection
                persistAuditLog(auditEvent).catch(err => {
                    logger.error('Failed to persist audit log:', err.message);
                });
            }

            return originalJson(data);
        };

        next();
    };
};

/**
 * Extract relevant changes from request body
 */
const extractChanges = (body, operationType) => {
    const relevantFields = {
        'payment-status-update': ['paymentStatus', 'totalAmount'],
        'order-status-update': ['status', 'paymentStatus'],
        'revenue-adjustment': ['totalAmount', 'discount'],
        'order-delete': ['_id', 'status', 'totalAmount']
    };

    const fields = relevantFields[operationType] || Object.keys(body || {});
    const changes = {};

    fields.forEach(field => {
        if (body && body[field] !== undefined) {
            changes[field] = body[field];
        }
    });

    return changes;
};

/**
 * Persist audit logs to database (optional)
 * Uncomment when AuditLog model is available
 */
const persistAuditLog = async (auditEvent) => {
    try {
        // Uncomment when model is created
        // const AuditLog = require('../models/auditLog.model.js').default;
        // await AuditLog.create(auditEvent);
    } catch (error) {
        logger.error('Error persisting audit log:', error.message);
    }
};

/**
 * Utility to log data changes between old and new values
 */
export const logDataChange = (before, after, fields) => {
    const changes = {};
    
    fields.forEach(field => {
        if (before[field] !== after[field]) {
            changes[field] = {
                from: before[field],
                to: after[field]
            };
        }
    });

    return Object.keys(changes).length > 0 ? changes : null;
};

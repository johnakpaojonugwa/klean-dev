import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Klean Laundry Management API',
            version: '1.0.0',
            description: 'Enterprise laundry management system with notifications, analytics, and inventory tracking',
            contact: {
                name: 'API Support',
                email: 'support@klean.com'
            },
            license: {
                name: 'ISC'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development server'
            },
            {
                url: 'https://api.klean.com/api/v1',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT access token'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        errors: { type: 'array', items: { type: 'string' } }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        fullname: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'CUSTOMER'] },
                        avatar: { type: 'string' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        orderNumber: { type: 'string' },
                        customerId: { type: 'string' },
                        branchId: { type: 'string' },
                        status: { type: 'string', enum: ['RECEIVED', 'WASHING', 'DRYING', 'READY', 'DELIVERED', 'CANCELLED'] },
                        paymentStatus: { type: 'string', enum: ['UNPAID', 'PARTIAL', 'PAID'] },
                        totalAmount: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Notification: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        type: { type: 'string', enum: ['EMAIL', 'SMS', 'IN_APP'] },
                        category: { type: 'string' },
                        subject: { type: 'string' },
                        message: { type: 'string' },
                        status: { type: 'string', enum: ['PENDING', 'SENT', 'FAILED'] },
                        isRead: { type: 'boolean' },
                        sentAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: [
        './routes/auth.routes.js',
        './routes/user.routes.js',
        './routes/order.routes.js',
        './routes/inventory.routes.js',
        './routes/notification.routes.js',
        './routes/analytics.routes.js',
        './routes/branch.routes.js',
        './routes/admin.routes.js'
    ]
};

export const specs = swaggerJsdoc(options);

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
                url: 'https://klean.vercel.app/api/v1',
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
                },
                Branch: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                zip: { type: 'string' }
                            }
                        },
                        email: { type: 'string', format: 'email' },
                        contactNumber: { type: 'string' },
                        manager: { type: 'string' },
                        isActive: { type: 'boolean' },
                        operatingHours: { type: 'string' },
                        totalOrders: { type: 'number' },
                        totalRevenue: { type: 'number' },
                        branchCode: { type: 'string' },
                        servicesOffered: { type: 'array', items: { type: 'string' } }
                    }
                },
                Employee: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        salaryStructureId: { type: 'string' },
                        dateOfBirth: { type: 'string', format: 'date' },
                        gender: { type: 'string', enum: ['MALE', 'FEMALE'] },
                        phoneNumber: { type: 'string' },
                        alternatePhoneNumber: { type: 'string' },
                        address: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string' },
                        postalCode: { type: 'string' },
                        country: { type: 'string' },
                        employeeNumber: { type: 'string' },
                        designation: { type: 'string' },
                        department: { type: 'string' },
                        branchId: { type: 'string' },
                        joinDate: { type: 'string', format: 'date' },
                        employeeJobRole: { type: 'string', enum: ['BRANCH_MANAGER', 'SUPERVISOR', 'WASHER', 'IRONER', 'DRIVER', 'RECEPTIONIST', 'CLEANER'] },
                        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED'] },
                        avatar: { type: 'string' },
                        assignedTasks: { type: 'number' },
                        completedTasks: { type: 'number' },
                        performanceRating: { type: 'number' },
                        bankName: { type: 'string' },
                        accountNumber: { type: 'string' },
                        accountHolderName: { type: 'string' }
                    }
                },
                Inventory: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        branchId: { type: 'string' },
                        itemName: { type: 'string' },
                        category: { type: 'string', enum: ['DETERGENT', 'SOFTENER', 'STAIN_REMOVAL', 'PACKAGING', 'HANGERS', 'EQUIPMENTS', 'CHEMICALS', 'OTHER'] },
                        sku: { type: 'string' },
                        currentStock: { type: 'number' },
                        unit: { type: 'string', enum: ['kg', 'liters', 'pieces', 'boxes', 'rolls'] },
                        costPerUnit: { type: 'number' },
                        reorderLevel: { type: 'number' },
                        supplierContact: { type: 'string' },
                        lastRestocked: { type: 'string', format: 'date-time' },
                        reorderPending: { type: 'boolean' },
                        isActive: { type: 'boolean' }
                    }
                },
                Payroll: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        employeeId: { type: 'string' },
                        salaryStructureId: { type: 'string' },
                        branchId: { type: 'string' },
                        payrollMonth: { type: 'string', format: 'date' },
                        paymentDate: { type: 'string', format: 'date' },
                        totalWorkingDays: { type: 'number' },
                        attendedDays: { type: 'number' },
                        leavesTaken: { type: 'number' },
                        absentDays: { type: 'number' },
                        holidaysCount: { type: 'number' },
                        overtimeHours: { type: 'number' },
                        baseSalary: { type: 'number' },
                        houseRentAllowance: { type: 'number' },
                        conveyanceAllowance: { type: 'number' },
                        dearness: { type: 'number' },
                        performanceBonus: { type: 'number' },
                        overtimeEarnings: { type: 'number' },
                        otherAllowance: { type: 'number' },
                        grossSalary: { type: 'number' },
                        totalDeductions: { type: 'number' },
                        netSalary: { type: 'number' },
                        paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED'] }
                    }
                },
                Leave: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        employeeId: { type: 'string' },
                        leaveTypeId: { type: 'string' },
                        branchId: { type: 'string' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        numberOfDays: { type: 'number' },
                        reason: { type: 'string' },
                        description: { type: 'string' },
                        status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'] },
                        approvedBy: { type: 'string' },
                        approvalDate: { type: 'string', format: 'date' },
                        rejectionReason: { type: 'string' }
                    }
                },
                Invoice: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        invoiceNumber: { type: 'string' },
                        orderId: { type: 'string' },
                        customerId: { type: 'string' },
                        branchId: { type: 'string' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    description: { type: 'string' },
                                    quantity: { type: 'number' },
                                    unitPrice: { type: 'number' },
                                    total: { type: 'number' }
                                }
                            }
                        },
                        subtotal: { type: 'number' },
                        tax: { type: 'number' },
                        discount: { type: 'number' },
                        totalAmount: { type: 'number' },
                        paymentStatus: { type: 'string', enum: ['UNPAID', 'PARTIAL', 'PAID', 'VOID'] },
                        paymentMethod: { type: 'string', enum: ['CASH', 'CARD', 'POS', 'WALLET'] },
                        dueDate: { type: 'string', format: 'date' },
                        paidDate: { type: 'string', format: 'date' },
                        notes: { type: 'string' }
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
        './routes/branchManager.routes.js',
        './routes/employee.routes.js',
        './routes/payroll.routes.js',
        './routes/leave.routes.js',
        './routes/invoice.routes.js'
    ]
};

export const specs = swaggerJsdoc(options);

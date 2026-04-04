import request from 'supertest';
import { createTestServer } from '../test-server.js';
import User from '../../models/user.model.js';
import Order from '../../models/order.model.js';
import Inventory from '../../models/inventory.model.js';
import { connectDB, closeDB } from '../../config/db.js';

const app = createTestServer();

describe('Order Management API Integration Tests', () => {
    let testUser;
    let testInventory;
    let authToken;
    let testOrder;

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await closeDB();
    });

    beforeEach(async () => {
        // Create test user
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashedpassword123',
            role: 'employee',
            branch: 'main'
        });

        // Create test inventory
        testInventory = await Inventory.create({
            itemName: 'Test Laundry Item',
            category: 'laundry',
            quantity: 100,
            unitPrice: 10.00,
            branch: 'main'
        });

        // Mock auth token
        authToken = 'mock-jwt-token';
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await Inventory.deleteMany({});
        await User.deleteMany({});
    });

    describe('POST /api/v1/orders', () => {
        it('should create a new order successfully', async () => {
            const orderData = {
                customerName: 'John Doe',
                customerPhone: '1234567890',
                customerEmail: 'john@example.com',
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 5,
                    unitPrice: 10.00
                }],
                totalAmount: 50.00,
                branch: 'main',
                status: 'pending'
            };

            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.customerName).toBe(orderData.customerName);
            expect(response.body.data.totalAmount).toBe(orderData.totalAmount);

            testOrder = response.body.data;
        });

        it('should fail to create order with invalid data', async () => {
            const invalidOrderData = {
                customerName: '',
                items: [],
                totalAmount: -10
            };

            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidOrderData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('validation');
        });

        it('should fail to create order without authentication', async () => {
            const orderData = {
                customerName: 'Jane Doe',
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 2,
                    unitPrice: 10.00
                }],
                totalAmount: 20.00
            };

            const response = await request(app)
                .post('/api/v1/orders')
                .send(orderData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/orders', () => {
        beforeEach(async () => {
            // Create test orders
            testOrder = await Order.create({
                customerName: 'Alice Smith',
                customerPhone: '9876543210',
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 3,
                    unitPrice: 10.00
                }],
                totalAmount: 30.00,
                branch: 'main',
                status: 'pending',
                createdBy: testUser._id
            });
        });

        it('should get all orders', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should get orders by branch', async () => {
            const response = await request(app)
                .get('/api/v1/orders?branch=main')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.every(order => order.branch === 'main')).toBe(true);
        });

        it('should get orders by status', async () => {
            const response = await request(app)
                .get('/api/v1/orders?status=pending')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.every(order => order.status === 'pending')).toBe(true);
        });
    });

    describe('GET /api/v1/orders/:id', () => {
        beforeEach(async () => {
            testOrder = await Order.create({
                customerName: 'Bob Johnson',
                customerPhone: '5551234567',
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 4,
                    unitPrice: 10.00
                }],
                totalAmount: 40.00,
                branch: 'main',
                status: 'processing',
                createdBy: testUser._id
            });
        });

        it('should get order by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(testOrder._id.toString());
            expect(response.body.data.customerName).toBe(testOrder.customerName);
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/v1/orders/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/orders/:id', () => {
        beforeEach(async () => {
            testOrder = await Order.create({
                customerName: 'Charlie Brown',
                customerPhone: '4449876543',
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 2,
                    unitPrice: 10.00
                }],
                totalAmount: 20.00,
                branch: 'main',
                status: 'pending',
                createdBy: testUser._id
            });
        });

        it('should update order status', async () => {
            const updateData = {
                status: 'completed',
                notes: 'Order completed successfully'
            };

            const response = await request(app)
                .put(`/api/v1/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('completed');
            expect(response.body.data.notes).toBe(updateData.notes);
        });

        it('should update order items and total', async () => {
            const updateData = {
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 6,
                    unitPrice: 10.00
                }],
                totalAmount: 60.00
            };

            const response = await request(app)
                .put(`/api/v1/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAmount).toBe(60.00);
            expect(response.body.data.items[0].quantity).toBe(6);
        });

        it('should fail to update non-existent order', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const updateData = { status: 'completed' };

            const response = await request(app)
                .put(`/api/v1/orders/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/orders/:id', () => {
        beforeEach(async () => {
            testOrder = await Order.create({
                customerName: 'Diana Prince',
                customerPhone: '3336549870',
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 1,
                    unitPrice: 10.00
                }],
                totalAmount: 10.00,
                branch: 'main',
                status: 'cancelled',
                createdBy: testUser._id
            });
        });

        it('should delete order successfully', async () => {
            const response = await request(app)
                .delete(`/api/v1/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify order is deleted
            const checkResponse = await request(app)
                .get(`/api/v1/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(checkResponse.status).toBe(404);
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .delete(`/api/v1/orders/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/orders/:id/payment', () => {
        beforeEach(async () => {
            testOrder = await Order.create({
                customerName: 'Eve Wilson',
                customerPhone: '2227894561',
                items: [{
                    inventoryId: testInventory._id,
                    quantity: 3,
                    unitPrice: 10.00
                }],
                totalAmount: 30.00,
                branch: 'main',
                status: 'pending',
                createdBy: testUser._id
            });
        });

        it('should process payment successfully', async () => {
            const paymentData = {
                amount: 30.00,
                paymentMethod: 'cash',
                paymentDate: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/v1/orders/${testOrder._id}/payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.paymentStatus).toBe('paid');
        });

        it('should handle partial payment', async () => {
            const paymentData = {
                amount: 15.00,
                paymentMethod: 'card',
                paymentDate: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/v1/orders/${testOrder._id}/payment`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.paymentStatus).toBe('partial');
        });
    });
});
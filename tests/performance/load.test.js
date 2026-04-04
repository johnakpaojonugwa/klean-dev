import { jest } from '@jest/globals';
import request from 'supertest';
import { createTestServer } from '../test-server.js';
import User from '../../models/user.model.js';
import Order from '../../models/order.model.js';
import Inventory from '../../models/inventory.model.js';
import { connectDB, closeDB } from '../../config/db.js';

const app = createTestServer();

describe('Performance and Load Tests', () => {
    let testUser;
    let authToken;
    let testOrders = [];
    let testInventory = [];

    beforeAll(async () => {
        await connectDB();

        // Create test user
        testUser = await User.create({
            username: 'perftest',
            email: 'perf@test.com',
            password: 'hashedpassword123',
            role: 'employee',
            branch: 'main'
        });

        // Generate auth token
        const jwt = (await import('jsonwebtoken')).default;
        authToken = jwt.sign(
            { userId: testUser._id, role: testUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Create bulk test data
        const inventoryData = [];
        for (let i = 0; i < 100; i++) {
            inventoryData.push({
                itemName: `Test Item ${i}`,
                category: 'laundry',
                quantity: Math.floor(Math.random() * 100) + 1,
                unitPrice: Math.floor(Math.random() * 50) + 5,
                branch: 'main'
            });
        }
        testInventory = await Inventory.insertMany(inventoryData);

        const orderData = [];
        for (let i = 0; i < 500; i++) {
            const randomItems = [];
            const itemCount = Math.floor(Math.random() * 5) + 1;
            let totalAmount = 0;

            for (let j = 0; j < itemCount; j++) {
                const randomInventory = testInventory[Math.floor(Math.random() * testInventory.length)];
                const quantity = Math.floor(Math.random() * 5) + 1;
                randomItems.push({
                    inventoryId: randomInventory._id,
                    quantity: quantity,
                    unitPrice: randomInventory.unitPrice
                });
                totalAmount += quantity * randomInventory.unitPrice;
            }

            orderData.push({
                customerName: `Customer ${i}`,
                customerPhone: `1234567${String(i).padStart(3, '0')}`,
                customerEmail: `customer${i}@example.com`,
                items: randomItems,
                totalAmount: totalAmount,
                branch: 'main',
                status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)],
                createdBy: testUser._id
            });
        }
        testOrders = await Order.insertMany(orderData);
    }, 30000); // Increase timeout for bulk data creation

    afterAll(async () => {
        await Order.deleteMany({});
        await Inventory.deleteMany({});
        await User.deleteMany({});
        await closeDB();
    });

    describe('API Response Time Tests', () => {
        it('should respond to health check within 100ms', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/v1/health');

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(100);
        });

        it('should handle order creation within acceptable time', async () => {
            const orderData = {
                customerName: 'Performance Test Customer',
                customerPhone: '9998887776',
                customerEmail: 'perf@example.com',
                items: [{
                    inventoryId: testInventory[0]._id,
                    quantity: 2,
                    unitPrice: 10.00
                }],
                totalAmount: 20.00,
                branch: 'main',
                status: 'pending'
            };

            const startTime = Date.now();

            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData);

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(201);
            expect(responseTime).toBeLessThan(500); // Should complete within 500ms
        });

        it('should handle order retrieval within acceptable time', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${authToken}`);

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // Should complete within 1s for 500 records
        });
    });

    describe('Concurrent Request Handling', () => {
        it('should handle multiple simultaneous order creations', async () => {
            const createOrder = async (index) => {
                const orderData = {
                    customerName: `Concurrent Customer ${index}`,
                    customerPhone: `111222${String(index).padStart(4, '0')}`,
                    customerEmail: `concurrent${index}@example.com`,
                    items: [{
                        inventoryId: testInventory[index % testInventory.length]._id,
                        quantity: 1,
                        unitPrice: 10.00
                    }],
                    totalAmount: 10.00,
                    branch: 'main',
                    status: 'pending'
                };

                return request(app)
                    .post('/api/v1/orders')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(orderData);
            };

            const startTime = Date.now();
            const promises = [];

            // Create 10 concurrent requests
            for (let i = 0; i < 10; i++) {
                promises.push(createOrder(i));
            }

            const responses = await Promise.all(promises);
            const totalTime = Date.now() - startTime;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
            });

            // Total time should be reasonable (allowing for some parallel processing)
            expect(totalTime).toBeLessThan(5000); // Less than 5 seconds for 10 concurrent requests
        });

        it('should handle multiple simultaneous order queries', async () => {
            const queryOrders = async () => {
                return request(app)
                    .get('/api/v1/orders')
                    .set('Authorization', `Bearer ${authToken}`);
            };

            const startTime = Date.now();
            const promises = [];

            // Create 5 concurrent read requests
            for (let i = 0; i < 5; i++) {
                promises.push(queryOrders());
            }

            const responses = await Promise.all(promises);
            const totalTime = Date.now() - startTime;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            // Total time should be reasonable
            expect(totalTime).toBeLessThan(3000); // Less than 3 seconds for 5 concurrent reads
        });
    });

    describe('Memory and Resource Usage', () => {
        it('should not leak memory during repeated operations', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Perform 50 order creation operations
            for (let i = 0; i < 50; i++) {
                const orderData = {
                    customerName: `Memory Test Customer ${i}`,
                    customerPhone: `333444${String(i).padStart(4, '0')}`,
                    customerEmail: `memory${i}@example.com`,
                    items: [{
                        inventoryId: testInventory[i % testInventory.length]._id,
                        quantity: 1,
                        unitPrice: 10.00
                    }],
                    totalAmount: 10.00,
                    branch: 'main',
                    status: 'pending'
                };

                await request(app)
                    .post('/api/v1/orders')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(orderData);
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });
    });

    describe('Database Query Performance', () => {
        it('should handle large dataset queries efficiently', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/v1/orders?limit=100')
                .set('Authorization', `Bearer ${authToken}`);

            const queryTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeLessThanOrEqual(100);
            expect(queryTime).toBeLessThan(2000); // Should complete within 2 seconds
        });

        it('should handle filtered queries efficiently', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/v1/orders?status=completed&branch=main')
                .set('Authorization', `Bearer ${authToken}`);

            const queryTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(queryTime).toBeLessThan(1500); // Should complete within 1.5 seconds
        });
    });

    describe('Error Handling Performance', () => {
        it('should handle invalid requests quickly', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/v1/orders/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(400); // Assuming invalid ID returns 400
            expect(responseTime).toBeLessThan(200); // Error responses should be fast
        });

        it('should handle unauthorized requests quickly', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', 'Bearer invalid-token');

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(401);
            expect(responseTime).toBeLessThan(200); // Auth failures should be fast
        });
    });

    describe('Load Test Simulation', () => {
        it('should maintain response times under sustained load', async () => {
            const responseTimes = [];
            const numberOfRequests = 20;

            for (let i = 0; i < numberOfRequests; i++) {
                const startTime = Date.now();

                await request(app)
                    .get('/api/v1/health');

                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);

                // Small delay to simulate realistic load
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);

            expect(averageResponseTime).toBeLessThan(150); // Average under 150ms
            expect(maxResponseTime).toBeLessThan(300); // Max under 300ms
        });
    });
});
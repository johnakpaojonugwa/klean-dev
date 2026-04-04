import { jest } from '@jest/globals';
import { analyticsService } from '../../services/analyticsService.js';
import Order from '../../models/order.model.js';
import Inventory from '../../models/inventory.model.js';
import User from '../../models/user.model.js';
import { connectDB, closeDB } from '../../config/db.js';

describe('Analytics Service Unit Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await closeDB();
    });

    beforeEach(async () => {
        // Clear all collections before each test
        await Order.deleteMany({});
        await Inventory.deleteMany({});
        await User.deleteMany({});
    });

    describe('getRevenueAnalytics', () => {
        it('should calculate total revenue correctly', async () => {
            // Create test orders with different dates and amounts
            const orders = [
                {
                    customerName: 'Test Customer 1',
                    totalAmount: 100.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-15'),
                    branch: 'main'
                },
                {
                    customerName: 'Test Customer 2',
                    totalAmount: 200.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-20'),
                    branch: 'main'
                },
                {
                    customerName: 'Test Customer 3',
                    totalAmount: 50.00,
                    status: 'pending',
                    createdAt: new Date('2024-01-25'),
                    branch: 'main'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getRevenueAnalytics('2024-01-01', '2024-01-31', 'main');

            expect(result.totalRevenue).toBe(300.00); // Only completed orders
            expect(result.completedOrders).toBe(2);
            expect(result.pendingOrders).toBe(1);
        });

        it('should handle empty results', async () => {
            const result = await AnalyticsService.getRevenueAnalytics('2024-01-01', '2024-01-31', 'main');

            expect(result.totalRevenue).toBe(0);
            expect(result.completedOrders).toBe(0);
            expect(result.pendingOrders).toBe(0);
            expect(result.averageOrderValue).toBe(0);
        });

        it('should calculate average order value', async () => {
            const orders = [
                {
                    customerName: 'Test Customer 1',
                    totalAmount: 100.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-15'),
                    branch: 'main'
                },
                {
                    customerName: 'Test Customer 2',
                    totalAmount: 200.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-20'),
                    branch: 'main'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getRevenueAnalytics('2024-01-01', '2024-01-31', 'main');

            expect(result.averageOrderValue).toBe(150.00); // (100 + 200) / 2
        });
    });

    describe('getInventoryAnalytics', () => {
        it('should calculate inventory metrics correctly', async () => {
            const inventory = [
                {
                    itemName: 'Item 1',
                    category: 'laundry',
                    quantity: 50,
                    unitPrice: 10.00,
                    branch: 'main',
                    lowStockThreshold: 20
                },
                {
                    itemName: 'Item 2',
                    category: 'supplies',
                    quantity: 10,
                    unitPrice: 5.00,
                    branch: 'main',
                    lowStockThreshold: 20
                },
                {
                    itemName: 'Item 3',
                    category: 'laundry',
                    quantity: 100,
                    unitPrice: 15.00,
                    branch: 'main',
                    lowStockThreshold: 30
                }
            ];

            await Inventory.insertMany(inventory);

            const result = await AnalyticsService.getInventoryAnalytics('main');

            expect(result.totalItems).toBe(3);
            expect(result.totalValue).toBe(2000.00); // (50*10) + (10*5) + (100*15)
            expect(result.lowStockItems).toBe(1); // Item 2 has quantity < threshold
            expect(result.categories.laundry).toBe(2);
            expect(result.categories.supplies).toBe(1);
        });

        it('should handle empty inventory', async () => {
            const result = await AnalyticsService.getInventoryAnalytics('main');

            expect(result.totalItems).toBe(0);
            expect(result.totalValue).toBe(0);
            expect(result.lowStockItems).toBe(0);
            expect(Object.keys(result.categories).length).toBe(0);
        });
    });

    describe('getCustomerAnalytics', () => {
        it('should calculate customer metrics correctly', async () => {
            const orders = [
                {
                    customerName: 'John Doe',
                    customerEmail: 'john@example.com',
                    totalAmount: 150.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-10'),
                    branch: 'main'
                },
                {
                    customerName: 'John Doe',
                    customerEmail: 'john@example.com',
                    totalAmount: 200.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-20'),
                    branch: 'main'
                },
                {
                    customerName: 'Jane Smith',
                    customerEmail: 'jane@example.com',
                    totalAmount: 100.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-15'),
                    branch: 'main'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getCustomerAnalytics('2024-01-01', '2024-01-31', 'main');

            expect(result.totalCustomers).toBe(2);
            expect(result.repeatCustomers).toBe(1); // John Doe has 2 orders
            expect(result.averageCustomerValue).toBe(225.00); // (350 + 100) / 2
            expect(result.topCustomers.length).toBe(2);
        });

        it('should identify top customers', async () => {
            const orders = [
                {
                    customerName: 'Customer A',
                    totalAmount: 500.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-10'),
                    branch: 'main'
                },
                {
                    customerName: 'Customer B',
                    totalAmount: 300.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-15'),
                    branch: 'main'
                },
                {
                    customerName: 'Customer C',
                    totalAmount: 200.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-20'),
                    branch: 'main'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getCustomerAnalytics('2024-01-01', '2024-01-31', 'main');

            expect(result.topCustomers[0].name).toBe('Customer A');
            expect(result.topCustomers[0].totalSpent).toBe(500.00);
            expect(result.topCustomers[1].name).toBe('Customer B');
            expect(result.topCustomers[1].totalSpent).toBe(300.00);
        });
    });

    describe('getPerformanceAnalytics', () => {
        it('should calculate performance metrics', async () => {
            const orders = [
                {
                    customerName: 'Test 1',
                    totalAmount: 100.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-01T10:00:00'),
                    completedAt: new Date('2024-01-01T12:00:00'),
                    branch: 'main'
                },
                {
                    customerName: 'Test 2',
                    totalAmount: 200.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-02T09:00:00'),
                    completedAt: new Date('2024-01-02T11:00:00'),
                    branch: 'main'
                },
                {
                    customerName: 'Test 3',
                    totalAmount: 150.00,
                    status: 'processing',
                    createdAt: new Date('2024-01-03T08:00:00'),
                    branch: 'main'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getPerformanceAnalytics('2024-01-01', '2024-01-31', 'main');

            expect(result.averageProcessingTime).toBe(2); // 2 hours average
            expect(result.onTimeDeliveryRate).toBe(100); // Assuming all completed orders are on time
            expect(result.orderCompletionRate).toBe(67); // 2 out of 3 completed
        });

        it('should handle orders without completion time', async () => {
            const orders = [
                {
                    customerName: 'Test 1',
                    totalAmount: 100.00,
                    status: 'pending',
                    createdAt: new Date('2024-01-01T10:00:00'),
                    branch: 'main'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getPerformanceAnalytics('2024-01-01', '2024-01-31', 'main');

            expect(result.averageProcessingTime).toBe(0);
            expect(result.orderCompletionRate).toBe(0);
        });
    });

    describe('getBranchComparison', () => {
        it('should compare metrics across branches', async () => {
            const orders = [
                {
                    customerName: 'Branch A Order 1',
                    totalAmount: 100.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-15'),
                    branch: 'branch_a'
                },
                {
                    customerName: 'Branch A Order 2',
                    totalAmount: 200.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-20'),
                    branch: 'branch_a'
                },
                {
                    customerName: 'Branch B Order 1',
                    totalAmount: 150.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-15'),
                    branch: 'branch_b'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getBranchComparison('2024-01-01', '2024-01-31');

            expect(result.branches).toHaveLength(2);
            const branchA = result.branches.find(b => b.branch === 'branch_a');
            const branchB = result.branches.find(b => b.branch === 'branch_b');

            expect(branchA.totalRevenue).toBe(300.00);
            expect(branchA.orderCount).toBe(2);
            expect(branchB.totalRevenue).toBe(150.00);
            expect(branchB.orderCount).toBe(1);
        });

        it('should handle single branch data', async () => {
            const orders = [
                {
                    customerName: 'Single Branch Order',
                    totalAmount: 100.00,
                    status: 'completed',
                    createdAt: new Date('2024-01-15'),
                    branch: 'main'
                }
            ];

            await Order.insertMany(orders);

            const result = await AnalyticsService.getBranchComparison('2024-01-01', '2024-01-31');

            expect(result.branches).toHaveLength(1);
            expect(result.branches[0].branch).toBe('main');
            expect(result.branches[0].totalRevenue).toBe(100.00);
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            // Mock a database error
            const originalFind = Order.find;
            Order.find = jest.fn().mockRejectedValue(new Error('Database connection failed'));

            await expect(AnalyticsService.getRevenueAnalytics('2024-01-01', '2024-01-31', 'main'))
                .rejects.toThrow('Database connection failed');

            // Restore original method
            Order.find = originalFind;
        });

        it('should handle invalid date ranges', async () => {
            await expect(AnalyticsService.getRevenueAnalytics('invalid-date', '2024-01-31', 'main'))
                .rejects.toThrow();
        });
    });
});
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Inventory from "../models/inventory.model.js";
import Branch from "../models/branch.model.js";
import { logger } from "../utils/logger.js";
import redisService from "./redisService.js";

const getBranchMatch = (branchId) => {
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
        const objId = new mongoose.Types.ObjectId(branchId);
        // This ensures that whether the DB has a String or an ObjectId, we find it.
        return { 
            branchId: { $in: [objId, branchId.toString()] } 
        };
    }
    return {};
};

export const analyticsService = {
    // GENERATE DAILY ANALYTICS
    generateDailyAnalytics: async (dateInput = new Date(), branchId = null) => {
    try {
        // Check Redis cache first (10 minute TTL)
        const date = new Date(dateInput);
        const dateStr = date.toISOString().split('T')[0];
        const cacheKey = `daily_analytics:${dateStr}:${branchId || 'all'}`;
        const cachedResult = await redisService.get(cacheKey);
        
        if (cachedResult) {
            logger.debug(`Cache hit for daily analytics: ${cacheKey}`);
            return JSON.parse(cachedResult);
        }

        const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));

        const matchStage = {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            ...getBranchMatch(branchId)
        };

            const orderMetrics = await Order.aggregate([
                { $match: matchStage },
                {
                    $facet: {
                        totals: [{
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                                totalValue: { $sum: "$totalAmount" },
                                revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] } }
                            }
                        }],
                        statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
                        paymentCounts: [{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }],
                        peakHours: [
                            { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 3 }
                        ]
                    }
                }
            ]);

            const m = orderMetrics[0];
            const totals = m.totals[0] || { count: 0, totalValue: 0, revenue: 0 };

            const newCustomers = await User.countDocuments({
                role: 'CUSTOMER',
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            const lowStockCount = await Inventory.countDocuments({
                ...getBranchMatch(branchId),
                $expr: { $lte: ['$currentStock', '$reorderLevel'] }
            });

            const safeBranchId = (branchId && mongoose.Types.ObjectId.isValid(branchId))
                ? new mongoose.Types.ObjectId(branchId)
                : null;

            const analyticsData = {
                date: startOfDay,
                branchId: safeBranchId,
                totalOrders: totals.count,
                totalOrderValue: totals.totalValue,
                totalRevenue: totals.revenue,
                averageOrderValue: totals.count > 0 ? totals.totalValue / totals.count : 0,
                ordersByStatus: m.statusCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
                paidOrders: m.paymentCounts.find(p => p._id === 'PAID')?.count || 0,
                unpaidOrders: m.paymentCounts.find(p => p._id === 'UNPAID')?.count || 0,
                newCustomers,
                lowStockAlerts: lowStockCount,
                peakOrderHours: m.peakHours.map(h => h._id).join(',')
            };

            // Cache the result for 10 minutes before returning
            await redisService.set(cacheKey, JSON.stringify(analyticsData), 'EX', 600);

            // Return live data without saving to database (unified live queries approach)
            return analyticsData;
        } catch (error) {
            logger.error("Daily Analytics Error:", error.message);
            throw error;
        }
    },

    // GET DASHBOARD SUMMARY
    getDashboardSummary: async (branchId = null) => {
    try {
        const cacheKey = redisService.getAnalyticsKey('dashboard', { branchId });
        const cacheTTL = 300; // 5 minutes cache

        return await redisService.getOrSet(cacheKey, async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const today = new Date(`${todayStr}T00:00:00Z`);

            const branchQuery = (branchId && mongoose.Types.ObjectId.isValid(branchId)) ? { _id: branchId } : {};
            const branches = await Branch.find(branchQuery).select('totalRevenue totalOrders name').lean();

            const orderMatch = getBranchMatch(branchId);
            
            // Combine live order stats and pending count in single aggregation
            const [aggregatedStats] = await Order.aggregate([
                { $match: orderMatch },
                {
                    $facet: {
                        liveStats: [
                            {
                                $group: {
                                    _id: null,
                                    totalOrders: { $sum: 1 },
                                    totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] } }
                                }
                            }
                        ],
                        pendingCount: [
                            { $match: { status: { $in: ['PENDING', 'PROCESSING', 'WASHING', 'DRYING', 'IRONING'] } } },
                            { $count: "count" }
                        ],
                        // NEW: Calculate branch leaderboard when branchId is null
                        ...(branchId === null ? {
                            branchLeaderboard: [
                                {
                                    $match: {
                                        paymentStatus: "PAID",
                                        branchId: { $exists: true, $ne: null }
                                    }
                                },
                                {
                                    $group: {
                                        _id: "$branchId",
                                        totalRevenue: { $sum: "$totalAmount" },
                                        totalOrders: { $sum: 1 }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "branches",
                                        localField: "_id",
                                        foreignField: "_id",
                                        as: "branchInfo"
                                    }
                                },
                                {
                                    $unwind: "$branchInfo"
                                },
                                {
                                    $project: {
                                        branchId: "$_id",
                                        name: "$branchInfo.name",
                                        totalRevenue: 1,
                                        totalOrders: 1
                                    }
                                },
                                {
                                    $sort: { totalRevenue: -1 }
                                }
                            ]
                        } : {})
                    }
                }
            ]);

            const liveStats = aggregatedStats.liveStats[0] || { totalOrders: 0, totalRevenue: 0 };
            const pendingCount = aggregatedStats.pendingCount[0]?.count || 0;
            const branchLeaderboard = aggregatedStats.branchLeaderboard || [];
            
            const safeBranchId = (branchId && mongoose.Types.ObjectId.isValid(branchId)) ? new mongoose.Types.ObjectId(branchId) : null;

            // Generate today's analytics live instead of checking stored data
            const todayData = await analyticsService.generateDailyAnalytics(today, branchId);

            const lowStock = await Inventory.find({
                ...getBranchMatch(branchId),
                $expr: { $lte: ["$currentStock", "$reorderLevel"] }
            }).select('name currentStock unit').lean();

            return {
                branchInfo: safeBranchId ? branches[0] : { name: "All Branches" },
                liveTotals: { revenue: liveStats.totalRevenue, orders: liveStats.totalOrders },
                today: todayData,
                pendingWorkload: pendingCount,
                inventoryAlerts: lowStock,
                branchCount: branches.length,
                branchLeaderboard: branchLeaderboard // Add this for SuperAdmin branch comparison
            };
        }, cacheTTL);
    } catch (error) {
        logger.error("Dashboard Summary Error:", error.message);
        throw error;
    }
},

    // Cache management methods
    clearAnalyticsCache: async (branchId = null) => {
        try {
            await redisService.clearAnalyticsCache();
            logger.info('Analytics cache cleared');
        } catch (error) {
            logger.error('Error clearing analytics cache:', error.message);
        }
    },

    clearDashboardCache: async (branchId = null) => {
        try {
            const cacheKey = redisService.getAnalyticsKey('dashboard', { branchId });
            await redisService.del(cacheKey);
            logger.info(`Dashboard cache cleared for branch: ${branchId || 'all'}`);
        } catch (error) {
            logger.error('Error clearing dashboard cache:', error.message);
        }
    },

    clearDailyAnalyticsCache: async (dateStr = null, branchId = null) => {
        try {
            const date = dateStr || new Date().toISOString().split('T')[0];
            const cacheKey = `daily_analytics:${date}:${branchId || 'all'}`;
            await redisService.del(cacheKey);
            logger.info(`Daily analytics cache cleared for ${date}, branch: ${branchId || 'all'}`);
        } catch (error) {
            logger.error('Error clearing daily analytics cache:', error.message);
        }
    },

    clearAllAnalyticsCacheForBranch: async (branchId) => {
        try {
            // Clear dashboard cache for this branch
            const dashboardKey = redisService.getAnalyticsKey('dashboard', { branchId });
            await redisService.del(dashboardKey);

            // Clear period analytics cache for this branch (need to clear multiple patterns)
            // Since we can't pattern match directly, we'll clear the main cache
            await redisService.clearAnalyticsCache();
            
            logger.info(`All analytics cache cleared for branch: ${branchId}`);
        } catch (error) {
            logger.error('Error clearing all analytics cache for branch:', error.message);
        }
    },

    // GET ANALYTICS PERIOD - LIVE QUERIES ONLY
    getAnalyticsPeriod: async (startDate, endDate, branchId = null) => {
        try {
            const cacheKey = redisService.getAnalyticsKey('period', {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                branchId
            });
            const cacheTTL = 600; // 10 minutes cache for period analytics

            return await redisService.getOrSet(cacheKey, async () => {
            const start = new Date(new Date(startDate).setUTCHours(0, 0, 0, 0));
            const end = new Date(new Date(endDate).setUTCHours(23, 59, 59, 999));

            // Generate live analytics for each day in the range
            const analytics = [];
            let totalOrders = 0;
            let totalRevenue = 0;

            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const dayStart = new Date(date.setUTCHours(0, 0, 0, 0));
                const dayEnd = new Date(date.setUTCHours(23, 59, 59, 999));

                const matchStage = {
                    createdAt: { $gte: dayStart, $lte: dayEnd },
                    ...getBranchMatch(branchId)
                };

                const dayMetrics = await Order.aggregate([
                    { $match: matchStage },
                    {
                        $facet: {
                            totals: [{
                                $group: {
                                    _id: null,
                                    count: { $sum: 1 },
                                    totalValue: { $sum: "$totalAmount" },
                                    revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] } }
                                }
                            }],
                            statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
                            paymentCounts: [{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }]
                        }
                    }
                ]);

                const m = dayMetrics[0];
                const totals = m.totals[0] || { count: 0, totalValue: 0, revenue: 0 };

                // Accumulate totals
                totalOrders += totals.count;
                totalRevenue += totals.revenue;

                // Create daily analytics object
                const dailyAnalytics = {
                    date: dayStart,
                    branchId: branchId ? (mongoose.Types.ObjectId.isValid(branchId) ? new mongoose.Types.ObjectId(branchId) : null) : null,
                    totalOrders: totals.count,
                    totalOrderValue: totals.totalValue,
                    totalRevenue: totals.revenue,
                    averageOrderValue: totals.count > 0 ? totals.totalValue / totals.count : 0,
                    ordersByStatus: m.statusCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
                    paidOrders: m.paymentCounts.find(p => p._id === 'PAID')?.count || 0,
                    unpaidOrders: m.paymentCounts.find(p => p._id === 'UNPAID')?.count || 0
                };

                analytics.push(dailyAnalytics);
            }

            // Get new customers for the period
            const newCustomers = await User.countDocuments({
                role: 'CUSTOMER',
                createdAt: { $gte: start, $lte: end }
            });

            return {
                analytics,
                totals: {
                    totalOrders,
                    totalRevenue,
                    newCustomers
                }
            };
            }, cacheTTL);
        } catch (error) {
            logger.error("Get Analytics Period Error:", error.message);
            throw error;
        }
    },

    // GET SUPER ADMIN SUMMARY
    getSuperAdminSummary: async () => {
        try {
            const companyTotals = await Branch.aggregate([
                { $group: { _id: null, totalCompanyRevenue: { $sum: "$totalRevenue" }, totalCompanyOrders: { $sum: "$totalOrders" }, branchCount: { $sum: 1 } } }
            ]);

            const criticalInventory = await Inventory.find({ $expr: { $lte: ["$currentStock", "$reorderLevel"] } })
                .populate('branchId', 'name')
                .select('name currentStock unit branchId')
                .lean() // Optimize read-only query
                .limit(10);

            const recentBigOrders = await Order.find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
                .populate('branchId', 'name')
                .populate('customerId', 'fullname')
                .lean() // Optimize read-only query
                .sort({ totalAmount: -1 })
                .limit(5);

            return {
                overview: companyTotals[0] || { totalCompanyRevenue: 0, totalCompanyOrders: 0, branchCount: 0 },
                criticalStockAlerts: criticalInventory,
                recentActivity: recentBigOrders
            };
        } catch (error) {
            logger.error("SuperAdmin Summary Error:", error.message);
            throw error;
        }
    }
};
import mongoose from "mongoose";
import Analytics from "../models/analytics.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Inventory from "../models/inventory.model.js";
import Branch from "../models/branch.model.js";
import { logger } from "../utils/logger.js";

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
        const date = new Date(dateInput);
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

            return await Analytics.findOneAndUpdate(
                { date: startOfDay, branchId: safeBranchId },
                analyticsData,
                { upsert: true, new: true }
            );
        } catch (error) {
            logger.error("Daily Analytics Error:", error.message);
            throw error;
        }
    },

    // GET DASHBOARD SUMMARY
    getDashboardSummary: async (branchId = null) => {
        try {
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
                        ]
                    }
                }
            ]);

            const liveStats = aggregatedStats.liveStats[0] || { totalOrders: 0, totalRevenue: 0 };
            const pendingCount = aggregatedStats.pendingCount[0]?.count || 0;
            const safeBranchId = (branchId && mongoose.Types.ObjectId.isValid(branchId)) ? new mongoose.Types.ObjectId(branchId) : null;

            let todayData = await Analytics.findOne({ date: today, branchId: safeBranchId }).lean();

            if (!todayData) {
                todayData = await analyticsService.generateDailyAnalytics(today, branchId);
            }

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
                branchCount: branches.length
            };
        } catch (error) {
            logger.error("Dashboard Summary Error:", error.message);
            throw error;
        }
    },

    // GET ANALYTICS PERIOD 
    getAnalyticsPeriod: async (startDate, endDate, branchId = null) => {
        try {
            const start = new Date(new Date(startDate).setUTCHours(0, 0, 0, 0));
            const end = new Date(new Date(endDate).setUTCHours(23, 59, 59, 999));

            const analyticsQuery = {
                date: { $gte: start, $lte: end },
                ...getBranchMatch(branchId)
            };

            const orderMatch = {
                createdAt: { $gte: start, $lte: end },
                ...getBranchMatch(branchId)
            };

            // Execute all queries in parallel for better performance
            const [analytics, periodStatsResult, newCustomers] = await Promise.all([
                Analytics.find(analyticsQuery).sort({ date: 1 }).lean(),
                Order.aggregate([
                    { $match: orderMatch },
                    {
                        $group: {
                            _id: null,
                            totalOrders: { $sum: 1 },
                            totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] } }
                        }
                    }
                ]),
                User.countDocuments({
                    role: 'CUSTOMER',
                    createdAt: { $gte: start, $lte: end }
                })
            ]);

            const stats = periodStatsResult[0] || { totalOrders: 0, totalRevenue: 0 };

            return {
                analytics,
                totals: {
                    totalOrders: stats.totalOrders,
                    totalRevenue: stats.totalRevenue,
                    newCustomers
                }
            };
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
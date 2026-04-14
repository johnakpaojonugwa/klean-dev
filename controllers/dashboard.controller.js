import Order from "../models/order.model.js";
import Inventory from "../models/inventory.model.js";
import Branch from "../models/branch.model.js";
import Employee from "../models/employee.model.js";
import { sendResponse } from "../utils/response.js";

export const getManagerDashboard = async (req, res, next) => {
    try {
        const branchId = req.user.branchId; 

        // Fetch Branch Stats
        const branchStats = await Branch.findById(branchId)
            .select('totalOrders totalRevenue name branchCode');

        // Fetch Aggregated Metrics
        const metrics = await Order.aggregate([
            { $match: { branchId: branchStats._id } },
            {
                $facet: {
                    // Count orders by status
                    "statusCounts": [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    // Revenue from the last 30 days
                    "recentRevenue": [
                        { 
                            $match: { 
                                paymentStatus: 'PAID', 
                                updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
                            } 
                        },
                        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                    ]
                }
            }
        ]);

        // Get Inventory Alerts
        const lowStock = await Inventory.find({
            branchId,
            $expr: { $lte: ["$currentStock", "$reorderLevel"] }
        }).select('name currentStock unit').lean(); // Optimize read-only query

        // Staff Performance Snapshot
        const staffStats = await Employee.find({ branchId })
            .populate('userId', 'fullname')
            .select('completedTasks assignedTasks')
            .limit(5)
            .sort({ completedTasks: -1 })
            .lean(); // Optimize read-only query

        return sendResponse(res, 200, true, "Dashboard data retrieved", {
            summary: {
                allTimeRevenue: branchStats.totalRevenue,
                allTimeOrders: branchStats.totalOrders,
                recentMonthRevenue: metrics[0].recentRevenue[0]?.total || 0
            },
            orderBreakdown: metrics[0].statusCounts,
            inventoryAlerts: lowStock,
            topStaff: staffStats
        });
    } catch (error) {
        next(error);
    }
};
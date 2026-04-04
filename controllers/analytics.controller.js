import { sendResponse, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { analyticsService } from "../services/analyticsService.js";
import Branch from "../models/branch.model.js";
import PDFDocument from "pdfkit";

const getQueryBranchId = (user, queryId) => {
    if (user.role === 'BRANCH_MANAGER') return user.branchId;
    if (user.role === 'SUPER_ADMIN') return queryId || null;
    return null;
}

export const getDashboard = async (req, res, next) => {
    try {
        const branchId = getQueryBranchId(req.user, req.query.branchId);

        // Get the standard summary from the service
        const summary = await analyticsService.getDashboardSummary(branchId);

        // EXTRA: If Super Admin and no specific branch is selected, add the Leaderboard
        if (req.user.role === 'SUPER_ADMIN' && !req.query.branchId) {
            summary.branchLeaderboard = await Branch.find({})
                .select('name branchCode totalRevenue totalOrders')
                .sort({ totalRevenue: -1 })
                .limit(5)
                .lean(); // Optimize read-only query
        }

        logger.info(`Dashboard retrieved for user: ${req.user.id}`);
        return sendResponse(res, 200, true, "Dashboard data retrieved", summary);
    } catch (error) {
        logger.error("Get dashboard error:", error.message);
        next(error);
    }
};

export const getAnalyticsPeriod = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return sendError(res, 400, "startDate and endDate are required");

        // Validate date format (ISO 8601)
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return sendError(res, 400, "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)");
        }

        if (start > end) {
            return sendError(res, 400, "startDate cannot be after endDate");
        }

        // Prevent querying more than 1 year of data at once
        const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
            return sendError(res, 400, "Cannot query more than 365 days at once");
        }

        const queryBranchId = getQueryBranchId(req.user, branchId);

        const analytics = await analyticsService.getAnalyticsPeriod(start, end, queryBranchId);

        return sendResponse(res, 200, true, "Analytics retrieved", analytics);
    } catch (error) {
        next(error);
    }
};

export const getDailyAnalytics = async (req, res, next) => {
    try {
        const { date, startDate, branchId } = req.query; 
        const queryBranchId = getQueryBranchId(req.user, branchId);

        // Fallback to today if no date is provided
        const targetDate = startDate || date || new Date().toISOString().split('T')[0]; 
        const analyticsDate = new Date(targetDate);

        const analytics = await analyticsService.generateDailyAnalytics(
            analyticsDate,
            queryBranchId
        );

        logger.info(`Daily analytics generated for: ${analyticsDate.toDateString()}`);
        return sendResponse(res, 200, true, "Daily analytics retrieved", {
            date: analyticsDate,
            analytics
        });
    } catch (error) {
        logger.error("Get daily analytics error:", error.message);
        next(error);
    }
};

export const getOrderTrends = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return sendError(res, 400, "startDate and endDate are required");

        // Validate date format
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return sendError(res, 400, "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)");
        }

        if (start > end) {
            return sendError(res, 400, "startDate cannot be after endDate");
        }

        const queryBranchId = getQueryBranchId(req.user, branchId);
        const result = await analyticsService.getAnalyticsPeriod(start, end, queryBranchId);

        // ✅ Safety: Fallback to empty array if analytics is missing
        const analyticsData = result?.analytics || [];

        const trends = {
            dailyOrders: analyticsData.map(a => ({
                date: a.date,
                orders: a.totalOrders || 0,
                revenue: a.totalRevenue || 0
            })),
            statusBreakdown: analyticsData.reduce((acc, a) => {
                // ✅ Safety: Check if ordersByStatus exists
                const statusMap = a.ordersByStatus || {};
                Object.keys(statusMap).forEach(status => {
                    acc[status] = (acc[status] || 0) + statusMap[status];
                });
                return acc;
            }, {}),
            summary: result?.totals || { totalOrders: 0, totalRevenue: 0, newCustomers: 0 }
        };

        return sendResponse(res, 200, true, "Order trends retrieved", trends);
    } catch (error) {
        next(error);
    }
};

export const getRevenueAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        if (!startDate || !endDate) return sendError(res, 400, "startDate and endDate are required");

        // Validate date format
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return sendError(res, 400, "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)");
        }

        if (start > end) {
            return sendError(res, 400, "startDate cannot be after endDate");
        }

        const queryBranchId = getQueryBranchId(req.user, branchId);
        const result = await analyticsService.getAnalyticsPeriod(start, end, queryBranchId);

        const analyticsData = result?.analytics || [];
        const totals = result?.totals || { totalRevenue: 0, totalOrders: 0 };

        const revenue = {
            dailyRevenue: analyticsData.map(a => ({
                date: a.date,
                revenue: a.totalRevenue || 0,
                paid: a.paidOrders || 0,
                unpaid: a.unpaidOrders || 0
            })),
            totalRevenue: totals.totalRevenue,
            // ✅ Safety: Prevent division by zero
            averageOrderValue: (totals.totalRevenue / (totals.totalOrders || 1)).toFixed(2)
        };

        return sendResponse(res, 200, true, "Revenue analytics retrieved", revenue);
    } catch (error) {
        next(error);
    }
};

export const getCustomerAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId } = req.query;

        if (!startDate || !endDate) {
            return sendError(res, 400, "startDate and endDate are required");
        }

        // Validate date format
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return sendError(res, 400, "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)");
        }

        if (start > end) {
            return sendError(res, 400, "startDate cannot be after endDate");
        }

        const queryBranchId = getQueryBranchId(req.user, branchId);

        const result = await analyticsService.getAnalyticsPeriod(start, end, queryBranchId);

        const customers = {
            newCustomersPerDay: result.analytics.map(a => ({
                date: a.date,
                newCustomers: a.newCustomers,
                active: a.totalActiveCustomers
            })),
            totalNewCustomers: result.totals.newCustomers,
            averageNewCustomersPerDay: result.totals.newCustomers / (result.analytics.length || 1),
            growth: result.analytics.length > 1 && result.analytics[0].totalActiveCustomers > 0
                ? (((result.analytics[result.analytics.length - 1].totalActiveCustomers - result.analytics[0].totalActiveCustomers) / result.analytics[0].totalActiveCustomers) * 100).toFixed(2)
                : 0
        };

        logger.info(`Customer analytics retrieved`);
        return sendResponse(res, 200, true, "Customer analytics retrieved", customers);
    } catch (error) {
        logger.error("Get customer analytics error:", error.message);
        next(error);
    }
};

export const exportDashboardPDF = async (req, res, next) => {
    try {
        const { dashboardData, dateRange } = req.body;

        if (!dashboardData) {
            return sendError(res, 400, "No data provided for export");
        }

        // Create a new PDF Document
        const doc = new PDFDocument({ margin: 50 });

        // Set headers so the browser knows it's a PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Dashboard-Report-${Date.now()}.pdf`);

        // Pipe the PDF directly to the response stream
        doc.pipe(res);

        // --- PDF CONTENT START ---
        doc.fontSize(20).text('System Performance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
        doc.text(`Reporting Period: ${dateRange || 'All Time'}`);
        doc.moveDown();
        doc.rect(50, doc.y, 500, 2).fill('#eeeeee'); // Horizontal line
        doc.moveDown();

        // Key Stats Section
        doc.fontSize(16).text('Key Metrics');
        doc.moveDown(0.5);
        doc.fontSize(12)
           .text(`Total Revenue: ₱${dashboardData.liveTotals?.revenue || 0}`)
           .text(`Total Orders: ${dashboardData.liveTotals?.orders || 0}`)
           .text(`Pending Workload: ${dashboardData.pendingWorkload || 0}`);

        // If you have charts or lists, you'd loop through them here
        if (dashboardData.recentOrders) {
            doc.moveDown().fontSize(16).text('Recent Transactions');
            dashboardData.recentOrders.forEach(order => {
                doc.fontSize(10).text(`${order.id} - ${order.customerName}: ₱${order.total}`);
            });
        }
        // Finalize the PDF
        doc.end();

        logger.info(`PDF successfully generated for user: ${req.user.id}`);

    } catch (error) {
        logger.error("Export PDF error:", error.message);
        if (!res.headersSent) {
            next(error);
        }
    }
};

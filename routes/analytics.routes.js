import express from "express";
import {
    getDashboard,
    getAnalyticsPeriod,
    getDailyAnalytics,
    getOrderTrends,
    getRevenueAnalytics,
    getCustomerAnalytics, 
    exportDashboardPDF
} from "../controllers/analytics.controller.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Dashboard (overview)
router.get('/dashboard', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getDashboard));

// Analytics endpoints
router.get('/period', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getAnalyticsPeriod));
router.get('/daily', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getDailyAnalytics));

// Specific analytics
router.get('/orders/trends', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getOrderTrends));
router.get('/revenue', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getRevenueAnalytics));
router.get('/customers', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getCustomerAnalytics));
router.post('/export/pdf', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(exportDashboardPDF));

export default router;

import express from "express";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getLowStockAlerts,
    resolveLowStockAlert,
    manuallyTriggerLowStockCheck
} from "../controllers/notification.controller.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Notification endpoints
router.get('/', auth, asyncHandler(getNotifications));
router.put('/:notificationId/read', auth, asyncHandler(markNotificationAsRead));
router.put('/mark-all-read', auth, asyncHandler(markAllNotificationsAsRead));
router.delete('/:notificationId', auth, asyncHandler(deleteNotification));

// Low-stock alerts
router.get('/low-stock/alerts', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getLowStockAlerts));
router.put('/low-stock/alerts/:alertId/resolve', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(resolveLowStockAlert));

// Trigger check (admin only)
router.post('/low-stock/check', auth, authorize('SUPER_ADMIN'), asyncHandler(manuallyTriggerLowStockCheck));

export default router;

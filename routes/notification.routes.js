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

// Apply auth to all notification routes
router.use(auth);

// Notification endpoints
router.get('/', asyncHandler(getNotifications));
router.put('/:notificationId/read', asyncHandler(markNotificationAsRead));
router.put('/mark-all-read', asyncHandler(markAllNotificationsAsRead));
router.delete('/:notificationId', asyncHandler(deleteNotification));

// Low-stock alerts
router.get('/low-stock/alerts', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getLowStockAlerts));
router.put('/low-stock/alerts/:alertId/resolve', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(resolveLowStockAlert));

// Trigger check (admin only)
router.post('/low-stock/check', authorize('SUPER_ADMIN'), asyncHandler(manuallyTriggerLowStockCheck));

export default router;

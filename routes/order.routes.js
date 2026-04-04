import express from "express";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    markOrderPaid
} from "../controllers/order.controller.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { validateCreateOrder } from "../middlewares/validationMiddleware.js";
import { auditLog } from "../middlewares/auditMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Customer can create orders
router.post('/', auth, validateCreateOrder, asyncHandler(createOrder));

// Get orders
router.get('/', auth, asyncHandler(getOrders));

// Get single order
router.get('/:orderId', auth, asyncHandler(getOrderById));

// Update order (admin/manager) - with audit logging for sensitive fields
router.put('/:orderId', 
    auth, 
    authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), 
    auditLog('order-update', 'Order details updated'),
    asyncHandler(updateOrder)
);

// Mark order paid (admin/manager) - with audit logging
router.put('/:orderId/mark-paid', 
    auth, 
    authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), 
    auditLog('payment-status-update', 'Order marked as paid'),
    asyncHandler(markOrderPaid)
);

// Update order status (admin/manager/staff) - with audit logging
router.patch('/:orderId/status', 
    auth, 
    authorize('SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF'), 
    auditLog('order-status-update', 'Order status changed'),
    asyncHandler(updateOrderStatus)
);

// Delete order (admin only) - with audit logging
router.delete('/:orderId', 
    auth, 
    authorize('SUPER_ADMIN'), 
    auditLog('order-delete', 'Order deleted'),
    asyncHandler(deleteOrder)
);

export default router;

import express from "express";
import {
    addInventoryItem,
    getInventoryByBranch,
    updateInventoryItem,
    adjustStock,
    deleteInventoryItem,
    getLowStockItems
} from "../controllers/inventory.controller.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Get low stock items (admin/manager view)
router.get('/low-stock', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getLowStockItems));

// Add inventory item
router.post('/', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(addInventoryItem));

// Get inventory by branch
router.get('/branch/:branchId', auth, asyncHandler(getInventoryByBranch));

// Update inventory item
router.put('/:itemId', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(updateInventoryItem));

// Adjust inventory item
router.patch('/:itemId/adjust', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(adjustStock));

// Delete inventory item
router.delete('/:itemId', auth, authorize('SUPER_ADMIN'), asyncHandler(deleteInventoryItem));

export default router;

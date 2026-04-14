import Inventory from "../models/inventory.model.js";
import StockLog from "../models/stockLog.model.js";
import { sendResponse, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import { analyticsService } from "../services/analyticsService.js";

// Add Inventory Item 
export const addInventoryItem = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { branchId, itemName, category, currentStock, unit, reorderLevel, supplierContact } = req.body;

        // Calculate initial reorder status
        const reorderPending = Number(currentStock) <= Number(reorderLevel);

        // Create Inventory Item
        const [item] = await Inventory.create([{
            branchId,
            itemName,
            category,
            currentStock,
            unit,
            reorderLevel,
            reorderPending,
            supplierContact,
            lastRestocked: new Date()
        }], { session });

        // Create initial log entry for opening stock
        await StockLog.create([{
            inventoryId: item._id,
            branchId: item.branchId,
            performedBy: req.user.id,
            changeType: 'RESTOCK',
            quantityChanged: currentStock,
            newStockLevel: currentStock,
            reason: "Initial Inventory Setup"
        }], { session });

        await session.commitTransaction();
        logger.info(`Inventory added: ${itemName} (Branch: ${branchId})`);
        
        return sendResponse(res, 201, true, "Inventory item created", { item });
    } catch (error) {
        await session.abortTransaction();
        logger.error("Add inventory error:", error.message);
        next(error);
    } finally {
        session.endSession();
    }
};

// Adjust Stock Levels (Usage or Restock)
export const adjustStock = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { itemId } = req.params;
        const { amount, changeType, reason, orderId } = req.body;

        const item = await Inventory.findById(itemId).session(session);
        if (!item) {
            await session.abortTransaction();
            return sendError(res, 404, "Inventory item not found");
        }

        // Prevent negative stock
        if (amount < 0 && (item.currentStock + amount) < 0) {
            await session.abortTransaction();
            return sendError(res, 400, "Insufficient stock", [
                `Current: ${item.currentStock} ${item.unit}. Requested: ${Math.abs(amount)}`
            ]);
        }

        // Update levels
        item.currentStock += amount;
        if (amount > 0) item.lastRestocked = new Date();
        
        // Update flags
        item.reorderPending = item.currentStock <= item.reorderLevel;
        await item.save({ session });

        // Audit Trail
        await StockLog.create([{
            inventoryId: item._id,
            branchId: item.branchId,
            performedBy: req.user.id,
            changeType: changeType || (amount > 0 ? 'RESTOCK' : 'USAGE'),
            quantityChanged: amount,
            newStockLevel: item.currentStock,
            reason: reason || "Manual Adjustment",
            orderId
        }], { session });

        await session.commitTransaction();

        // Clear analytics cache for this branch (inventory affects analytics)
        await analyticsService.clearAllAnalyticsCacheForBranch(item.branchId);

        return sendResponse(res, 200, true, "Stock adjusted", { item });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// Get Inventory (Branch Specific)
export const getInventoryByBranch = async (req, res, next) => {
    await Inventory.updateMany({ isActive: { $exists: false } }, { isActive: true }); 
    try {
        const { branchId } = req.params;
        const { category, page = 1, limit = 10, lowStock = false } = req.query;

        let query = { branchId };
        if (category) query.category = category;
        if (lowStock === 'true') {
            query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = parseInt(limit);

        // Fetch items and total count in parallel for pagination
        const [items, total] = await Promise.all([
            Inventory.find(query)
                .populate('branchId', 'name')
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum)
                .sort({ currentStock: 1 })
                .lean(), // Optimize read-only query
            Inventory.countDocuments(query)
        ]);

        return sendResponse(res, 200, true, "Items retrieved", {
            items,
            pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (error) {
        next(error);
    }
};

// Update Item Details 
export const updateInventoryItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const item = await Inventory.findById(itemId);

        if (!item) return sendError(res, 404, "Item not found");

        // Merge updates and manually check reorder status
        Object.assign(item, req.body);
        item.reorderPending = item.currentStock <= item.reorderLevel;
        
        await item.save();

        // Clear analytics cache for this branch
        await analyticsService.clearAllAnalyticsCacheForBranch(item.branchId);

        return sendResponse(res, 200, true, "Item updated", { item });
    } catch (error) {
        if (error.name === 'ValidationError') return sendError(res, 400, error.message);
        next(error);
    }
};

// Global Low Stock (Admin/Manager Dashboard)
export const getLowStockItems = async (req, res, next) => {
    try {
        const { branchId, page = 1, limit = 10 } = req.query;
        
        // Scope to branch if provided (for Managers)
        let query = { $expr: { $lte: ['$currentStock', '$reorderLevel'] } };
        if (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'STAFF') {
            query.branchId = req.user.branchId;
        } else if (req.user.role === 'SUPER_ADMIN' && branchId) {
            query.branchId = branchId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Fetch items and total count in parallel for pagination
        const [items, total] = await Promise.all([
            Inventory.find(query)
                .populate('branchId', 'name')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({ currentStock: 1 })
                .lean(), // Optimize read-only query
            Inventory.countDocuments(query)
        ]);

        return sendResponse(res, 200, true, "Low stock items", {
            items,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// Delete Item
export const deleteInventoryItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const item = await Inventory.findByIdAndDelete(itemId);
        
        if (!item) return sendError(res, 404, "Item not found");

        return sendResponse(res, 200, true, "Item deleted successfully");
    } catch (error) {
        next(error);
    }
};
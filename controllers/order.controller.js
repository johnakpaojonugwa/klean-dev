import Order from "../models/order.model.js";
import Branch from "../models/branch.model.js";
import Employee from "../models/employee.model.js";
import Inventory from "../models/inventory.model.js";
import StockLog from "../models/stockLog.model.js";
import { sendResponse, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import { isValidObjectId, sanitizeInput, sanitizeForRegex } from "../utils/validators.js";
import { analyticsService } from "../services/analyticsService.js";

// Inventory Deductions
const INVENTORY_TRANSITIONS = [
  {
    from: "PROCESSING",
    to: "WASHING",
    category: "DETERGENT", 
    quantity: 1,
    reason: (orderNumber) => `Order ${orderNumber} - Wash Started`,
  },
  {
    from: "WASHING",
    to: "DRYING",
    category: "SOFTENER",
    quantity: 1,
    reason: (orderNumber) => `Order ${orderNumber} - Drying Started`,
  },
  {
    from: "IRONING",
    to: "READY",
    category: "PACKAGING",
    quantity: 1,
    reason: (orderNumber) => `Order ${orderNumber} - Packaged for Pickup`,
  },
];

// Deduct inventory for a given transition
const deductInventoryForTransition = async (oldStatus, newStatus, order, session, performedBy) => {
  const rule = INVENTORY_TRANSITIONS.find(
    (transition) => transition.from === oldStatus && transition.to === newStatus
  );

  if (!rule) return null;
  
  // Check StockLog to avoid double-deducting for the same order and rule
  const existingLog = await StockLog.findOne({
    orderId: order._id,
    changeType: 'USAGE',
    reason: rule.reason(order.orderNumber)
  }).session(session);

  if (existingLog) {
    logger.info(`Inventory for ${newStatus} already deducted for order ${order.orderNumber}. skipping.`);
    return null;
  }

  const item = await Inventory.findOne({
    branchId: order.branchId,
    category: { $regex: new RegExp(`^${rule.category}$`, "i") },
    isActive: true,
  }).session(session);

  if (!item || item.currentStock < rule.quantity) {
    const friendlyCategory = rule.category.charAt(0).toUpperCase() + rule.category.slice(1);
    throw {
      statusCode: 400,
      message: `Insufficient ${friendlyCategory} in stock. Please restock before proceeding to ${newStatus}.`,
    };
  }

  item.currentStock -= rule.quantity;
  await item.save({ session });

  // Log the stock change with order reference for better traceability
  await StockLog.create(
    [
      {
        inventoryId: item._id,
        branchId: order.branchId,
        performedBy,
        changeType: "USAGE",
        quantityChanged: -rule.quantity,
        newStockLevel: item.currentStock,
        reason: rule.reason(order.orderNumber),
        orderId: order._id,
      },
    ],
    { session }
  );

  return item;
};

// Safe employee task adjustments (prevent negative counts)
const adjustEmployeeAssignedTasks = async (employeeId, delta, session) => {
  if (!employeeId) return;
  const employee = await Employee.findById(employeeId).session(session);
  if (!employee) {
    logger.warn(`Employee not found: ${employeeId}`);
    return;
  }
  const current = Number(employee.assignedTasks || 0);
  const updated = Math.max(0, current + delta);
  if (updated === current) return;
  employee.assignedTasks = updated;
  await employee.save({ session });
};

const adjustEmployeeCompletedTasks = async (employeeId, delta, session) => {
  if (!employeeId) return;
  const employee = await Employee.findById(employeeId).session(session);
  if (!employee) {
    logger.warn(`Employee not found: ${employeeId}`);
    return;
  }
  const current = Number(employee.completedTasks || 0);
  const updated = Math.max(0, current + delta);
  if (updated === current) return;
  employee.completedTasks = updated;
  await employee.save({ session });
};

// Create Order
export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      customerId, branchId, customerName, customerPhone, serviceType,
      items, pickupDate, deliveryDate, priority, discount, totalAmount, assignedEmployee,
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return sendError(res, 400, "At least one item is required");
    }

    // Normalize pickupDate
    const requestedPickup = new Date(pickupDate).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    if (requestedPickup < today) {
      await session.abortTransaction();
      return sendError(res, 400, "Pickup date cannot be in the past");
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemType || item.quantity <= 0 || item.unitPrice < 0) {
        await session.abortTransaction();
        return sendError(res, 400, `Invalid item at index ${i}`);
      }
    }

    // Determine effective IDs based on role
    const effectiveBranchId = req.user.role === "CUSTOMER" ? req.user.branchId : branchId;
    const effectiveCustomerId = req.user.role === "CUSTOMER" ? req.user.id : customerId;

    if (!effectiveBranchId || !isValidObjectId(effectiveBranchId)) {
      await session.abortTransaction();
      return sendError(res, 400, "Valid branch ID is required");
    }

    if (!effectiveCustomerId || !isValidObjectId(effectiveCustomerId)) {
      await session.abortTransaction();
      return sendError(res, 400, "Valid customer ID is required");
    }

    // Validate priority enum
    const validPriorities = ['NORMAL', 'EXPRESS', 'URGENT'];
    const effectivePriority = priority?.toUpperCase() || 'NORMAL';
    if (!validPriorities.includes(effectivePriority)) {
      await session.abortTransaction();
      return sendError(res, 400, "Invalid priority value");
    }

    // Validate serviceType enum
    const effectiveServiceType = serviceType?.toUpperCase() || 'WASH_FOLD';
    const validServiceTypes = ['WASH_FOLD', 'IRONING', 'DRY_CLEANING', 'STAIN_REMOVAL', 'ALTERATIONS'];
    if (!validServiceTypes.includes(effectiveServiceType)) {
      await session.abortTransaction();
      return sendError(res, 400, "Invalid service type value");
    }

    // Validate discount and amount
    const effectiveDiscount = Math.max(0, Math.min(100, discount || 0));

    // Create Order
    const order = new Order({
      customerId: effectiveCustomerId,
      customerName: sanitizeInput(customerName),
      customerPhone: sanitizeInput(customerPhone),
      branchId: effectiveBranchId,
      serviceType: effectiveServiceType,
      items: items.map(i => ({
        itemType: sanitizeInput(i.itemType),
        quantity: Math.max(1, parseInt(i.quantity) || 1),
        unitPrice: Math.max(0, parseFloat(i.unitPrice) || 0)
      })),
      pickupDate: new Date(pickupDate),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      priority: effectivePriority,
      discount: effectiveDiscount,
      assignedEmployee: assignedEmployee && isValidObjectId(assignedEmployee) ? assignedEmployee : undefined,
      createdBy: req.user.id || req.user._id,
      status: "PENDING",
      paymentStatus: "UNPAID",
    });

    await order.save({ session });
    
    // If an employee was assigned at creation, increment their assignedTasks safely
    if (order.assignedEmployee) {
      await adjustEmployeeAssignedTasks(order.assignedEmployee, 1, session);
    }

    // Update Branch Stats
    await Branch.findByIdAndUpdate(
      effectiveBranchId,
      { $inc: { totalOrders: 1 } },
      { session }
    );

    await session.commitTransaction();

    // Populate related fields for response
    const populatedOrder = await Order.findById(order._id).populate([
      "customerId", "branchId", "createdBy",
    ]);

    logger.info(`Order created by ${req.user.id}: ${order.orderNumber}`);

    // Clear analytics cache for affected branch
    analyticsService.clearDashboardCache(effectiveBranchId).catch(err =>
        logger.warn('Failed to clear analytics cache after order creation:', err.message)
    );

    return sendResponse(res, 201, true, "Order created successfully", { order: populatedOrder });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    logger.error("Create order error:", error.message);
    next(error);
  } finally {
    session.endSession();
  }
};

// Get Orders
export const getOrders = async (req, res, next) => {
  try {
    const { status, branchId, customerId, search, page = 1, limit = 10, paymentStatus } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    let query = {};

    // Role-based access control
    if (req.user.role === "CUSTOMER") {
      query.customerId = req.user.id;
    } else if (req.user.role === "BRANCH_MANAGER") {
      query.branchId = req.user.branchId;
    } else if (req.user.role === "SUPER_ADMIN" && branchId) {
      query.branchId = branchId;
    }

    if (req.user.role !== "CUSTOMER" && customerId) query.customerId = customerId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (search) {
      const safeSearch = sanitizeForRegex(search);
      query.$or = [
        { orderNumber: { $regex: safeSearch, $options: "i" } },
        { customerName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Fetch orders and total count in parallel for pagination
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate(
          req.user.role === "CUSTOMER"
            ? ["assignedEmployee"]
            : ["customerId", "branchId", "assignedEmployee"]
        )
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ createdAt: -1 })
        .lean(), // Optimize read-only query
      Order.countDocuments(query),
    ]);

    return sendResponse(res, 200, true, "Orders retrieved", {
      orders,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Order
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate([
      "customerId", 
      "branchId", 
      "assignedEmployee", 
      "createdBy", 
      "statusHistory.updatedBy",
    ]);

    if (!order) return sendError(res, 404, "Order not found");

    // Permissions Check
    const isCustomerOwner =
      req.user.role === "CUSTOMER" &&
      order.customerId?._id?.toString() === req.user.id;
      
    const isBranchStaff =
      (req.user.role === "BRANCH_MANAGER" || req.user.role === "STAFF") &&
      order.branchId?._id?.toString() === req.user.branchId?.toString();
      
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isCustomerOwner && !isBranchStaff && !isSuperAdmin) {
      return sendError(res, 403, "You do not have permission to view this order.");
    }

    return sendResponse(res, 200, true, "Order retrieved", { order });
  } catch (error) {
    next(error);
  }
};

// Mark Order Paid 
export const markOrderPaid = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, 404, "Order not found");
    }

    if (order.paymentStatus === 'PAID') {
      await session.abortTransaction();
      return sendResponse(res, 200, true, 'Order already marked paid', { order });
    }

    order.paymentStatus = 'PAID';
    // if order still pending, start processing
    if (order.status === 'PENDING') order.status = 'PROCESSING';
    // revenue recognition logic copied from updateOrder
    const amount = order.totalAmount;
    await Branch.findByIdAndUpdate(order.branchId, { $inc: { totalRevenue: amount } }, { session });

    await order.save({ session });
    await session.commitTransaction();

    const updated = await Order.findById(orderId).populate(["customerId","branchId","assignedEmployee"]);
    return sendResponse(res, 200, true, 'Payment status updated', { order: updated });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Update Order 
export const updateOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;
    const updates = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, 404, "Order not found");
    }

    const activeStatuses = ["PROCESSING", "WASHING", "DRYING", "IRONING"];
    const isTryingToProcess = updates.status && activeStatuses.includes(updates.status);
    if (isTryingToProcess && order.paymentStatus !== "PAID" && updates.paymentStatus !== "PAID") {
      await session.abortTransaction();
      return sendError(res, 400, "Order must be paid before processing");
    }

    const wasAlreadyPaid = order.paymentStatus === "PAID";
    const oldTotal = order.totalAmount;

    // Mark for revenue recognition after recalculation if payment is newly set to PAID
    let shouldRecognizeRevenueOnPaid = false;
    if (updates.paymentStatus === "PAID" && !wasAlreadyPaid) {
      shouldRecognizeRevenueOnPaid = true;
      if (order.status === "PENDING" && !updates.status) {
        updates.status = "PROCESSING";
      }
    }

    // Handle Employee Task count adjustments
    if (updates.assignedEmployee && order.assignedEmployee?.toString() !== updates.assignedEmployee) {
      if (order.assignedEmployee) {
        await adjustEmployeeAssignedTasks(order.assignedEmployee, -1, session);
      }
      if (isValidObjectId(updates.assignedEmployee)) {
        await adjustEmployeeAssignedTasks(updates.assignedEmployee, 1, session);
      }
    }

    const previousStatus = order.status;

    Object.assign(order, updates);

    if (updates.status && updates.status !== previousStatus) {
      order._updatedBy = req.user.id;
    }

    await order.validate();

    // If payment was newly marked PAID, recognize revenue using recalculated total
    if (shouldRecognizeRevenueOnPaid) {
      await Branch.findByIdAndUpdate(
        order.branchId,
        { $inc: { totalRevenue: order.totalAmount } },
        { session }
      );
    }

    // If it was already paid and total changed, adjust branch revenue by the difference
    if (wasAlreadyPaid && order.totalAmount !== oldTotal) {
      const difference = order.totalAmount - oldTotal;
      await Branch.findByIdAndUpdate(
        order.branchId,
        { $inc: { totalRevenue: difference } },
        { session }
      );
    }

    await order.save({ session });
    await session.commitTransaction();

    const updatedOrder = await Order.findById(orderId).populate(["customerId", "branchId", "assignedEmployee"]);

    return sendResponse(res, 200, true, "Order updated successfully", { order: updatedOrder });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Update Order Status (With Inventory Deduction)
export const updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, 404, "Order not found");
    }

    // Prevent moving from pending if not paid
    const isStartingProcess = ["PROCESSING", "WASHING"].includes(status);
    if (isStartingProcess && order.paymentStatus !== "PAID") {
      await session.abortTransaction();
      return sendError(res, 400, "Order must be paid before processing");
    }

    const oldStatus = order.status;
    if (oldStatus === status) {
        await session.abortTransaction();
        return sendResponse(res, 200, true, `Status is already ${status}`, { order });
    }


    // Inventory Deduction Logic
    try {
      await deductInventoryForTransition(oldStatus, status, order, session, req.user.id);
    } catch (stockError) {
      await session.abortTransaction();
      return sendError(res, stockError.statusCode || 400, stockError.message);
    }

    // Status Update
    order.status = status;
    order._updatedBy = req.user.id;

    // Task Tracking
    if (order.assignedEmployee && ["READY", "DELIVERED"].includes(status) && !["READY", "DELIVERED"].includes(oldStatus)) {
      await adjustEmployeeAssignedTasks(order.assignedEmployee, -1, session);
      await adjustEmployeeCompletedTasks(order.assignedEmployee, 1, session);
    }

    // NOTE: Revenue should be recognized on payment, not on status transition to avoid double-counting.

    await order.save({ session });
    await session.commitTransaction();

    logger.info(`Order ${order.orderNumber} transitioned ${oldStatus} -> ${status} by ${req.user.id}`);

    // Clear analytics cache for affected branch
    analyticsService.clearDashboardCache(order.branchId).catch(err =>
        logger.warn('Failed to clear analytics cache after status update:', err.message)
    );

    const finalOrder = await Order.findById(orderId).populate(["customerId", "branchId", "assignedEmployee"]);

    return sendResponse(res, 200, true, `Status changed to ${status}`, { order: finalOrder });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Delete Order
export const deleteOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, 404, "Order not found");
    }

    // Adjust branch stats if deleting an active order
    if (!["CANCELLED", "DELIVERED"].includes(order.status)) {
      await Branch.findByIdAndUpdate(
        order.branchId,
        { $inc: { totalOrders: -1 } },
        { session }
      );

      if (order.assignedEmployee) {
        await adjustEmployeeAssignedTasks(order.assignedEmployee, -1, session);
      }
    }

    await Order.findByIdAndDelete(orderId).session(session);
    await session.commitTransaction();

    logger.info(`Order ${orderId} deleted by ${req.user.id}`);
    return sendResponse(res, 200, true, "Order deleted successfully");
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
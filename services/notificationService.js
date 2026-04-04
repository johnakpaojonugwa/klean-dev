import Notification from "../models/notification.model.js";
import LowStockAlert from "../models/lowStockAlert.model.js";
import Inventory from "../models/inventory.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Branch from "../models/branch.model.js";
import { sendResponse, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { emailService } from "../utils/emailService.js";
import { smsService } from "../utils/smsService.js";

export const notificationService = {
    /**
     * Create and send notification
     */
    createAndSendNotification: async (userId, type, category, data) => {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }

            const notification = await Notification.create({
                userId,
                type,
                category,
                subject: data.subject,
                message: data.message,
                recipient: data.recipient || (type === 'EMAIL' ? user.email : user.phone),
                relatedOrderId: data.relatedOrderId
            });

            // Send based on type
            let sent = false;
            try {
                if (type === 'EMAIL') {
                    sent = await emailService.sendWelcomeEmail(user); // Generic, customize as needed
                } else if (type === 'SMS' && user.phone) {
                    sent = await smsService.sendWelcomeSMS(user.phone, user.fullname);
                }

                if (sent) {
                    await Notification.findByIdAndUpdate(notification._id, {
                        status: 'SENT',
                        sentAt: new Date()
                    });
                    logger.info(`Notification sent: ${notification._id}`);
                }
            } catch (sendError) {
                await Notification.findByIdAndUpdate(notification._id, {
                    status: 'FAILED',
                    error: sendError.message
                });
                logger.error(`Failed to send notification: ${sendError.message}`);
            }

            return notification;
        } catch (error) {
            logger.error("Create notification error:", error.message);
            throw error;
        }
    },

    /**
     * Get user notifications
     */
    getUserNotifications: async (userId, page = 1, limit = 10) => {
        try {
            const skip = (page - 1) * limit;
            const notifications = await Notification.find({ userId })
                .populate('relatedOrderId')
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });

            const total = await Notification.countDocuments({ userId });

            return {
                notifications,
                pagination: { total, page, pages: Math.ceil(total / limit) }
            };
        } catch (error) {
            logger.error("Get user notifications error:", error.message);
            throw error;
        }
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId) => {
        try {
            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { isRead: true, readAt: new Date() },
                { new: true }
            );
            return notification;
        } catch (error) {
            logger.error("Mark notification as read error:", error.message);
            throw error;
        }
    },

    /**
     * Check low stock and send alerts
     */
    checkAndAlertLowStock: async () => {
        try {
            logger.info("Starting low-stock check...");

            // Find all inventory items below reorder level
            const lowStockItems = await Inventory.find({
                $expr: { $lte: ['$currentStock', '$reorderLevel'] }
            }).populate('branchId');

            if (lowStockItems.length === 0) {
                logger.info("No low-stock items found");
                return;
            }

            // Group by branch
            const itemsByBranch = {};
            lowStockItems.forEach(item => {
                const branchId = item.branchId._id.toString();
                if (!itemsByBranch[branchId]) {
                    itemsByBranch[branchId] = [];
                }
                itemsByBranch[branchId].push(item);
            });

            // Send alerts for each branch
            for (const branchId in itemsByBranch) {
                const items = itemsByBranch[branchId];
                const branch = items[0].branchId;

                // Find branch manager
                const branchManager = await User.findOne({
                    branchId: branch._id,
                    role: 'BRANCH_MANAGER'
                });

                if (branchManager && branchManager.email) {
                    // Send email
                    await emailService.sendLowStockAlert(items, branchManager.email);

                    // Send SMS if phone available
                    if (branchManager.phone) {
                        await smsService.sendLowStockAlertSMS(branchManager.phone, items.length);
                    }

                    // Create notifications
                    for (const item of items) {
                        // Check if alert already exists
                        const existingAlert = await LowStockAlert.findOne({
                            inventoryId: item._id,
                            isResolved: false
                        });

                        if (existingAlert) {
                            // Update existing alert
                            await LowStockAlert.findByIdAndUpdate(existingAlert._id, {
                                $inc: { alertsSent: 1 },
                                alertSentAt: new Date()
                            });
                        } else {
                            // Create new alert
                            const alert = await LowStockAlert.create({
                                inventoryId: item._id,
                                branchId: branch._id,
                                itemName: item.itemName,
                                currentStock: item.currentStock,
                                reorderLevel: item.reorderLevel,
                                alertSentAt: new Date()
                            });

                            // Create notification record
                            const notification = await Notification.create({
                                userId: branchManager._id,
                                type: 'EMAIL',
                                category: 'LOW_STOCK',
                                subject: `Low Stock Alert: ${item.itemName}`,
                                message: `${item.itemName} has dropped to ${item.currentStock} ${item.unit}. Reorder level is ${item.reorderLevel} ${item.unit}.`,
                                recipient: branchManager.email,
                                status: 'SENT',
                                sentAt: new Date()
                            });

                            await LowStockAlert.findByIdAndUpdate(alert._id, {
                                $push: { notificationIds: notification._id }
                            });
                        }
                    }
                }
            }

            logger.info(`Low-stock check completed. ${lowStockItems.length} items flagged.`);
        } catch (error) {
            logger.error("Low-stock check error:", error.message);
        }
    },

    /**
     * Send order status notification
     */
    sendOrderStatusNotification: async (orderId) => {
        try {
            const order = await Order.findById(orderId)
                .populate('customerId')
                .populate('branchId');

            if (!order || !order.customerId) {
                throw new Error("Order or customer not found");
            }

            const customer = order.customerId;

            // Send email
            await emailService.sendOrderStatusEmail(order, customer);

            // Send SMS if available
            if (customer.phone) {
                await smsService.sendOrderStatusSMS(customer.phone, order.orderNumber, order.status);
            }

            // Create notification record
            await Notification.create({
                userId: customer._id,
                type: 'EMAIL',
                category: 'ORDER_UPDATE',
                subject: `Order #${order.orderNumber} - ${order.status}`,
                message: `Your order status has been updated to ${order.status}`,
                recipient: customer.email,
                relatedOrderId: orderId,
                status: 'SENT',
                sentAt: new Date()
            });

            logger.info(`Order status notification sent for order: ${orderId}`);
        } catch (error) {
            logger.error("Send order status notification error:", error.message);
        }
    },

    /**
     * Send payment reminder
     */
    sendPaymentReminder: async (orderId) => {
        try {
            const order = await Order.findById(orderId)
                .populate('customerId');

            if (!order || order.paymentStatus === 'PAID') {
                return;
            }

            const customer = order.customerId;

            // Send SMS (SMS is better for payment reminders)
            if (customer.phone) {
                await smsService.sendPaymentReminderSMS(
                    customer.phone,
                    order.orderNumber,
                    order.totalAmount
                );

                // Create notification
                await Notification.create({
                    userId: customer._id,
                    type: 'SMS',
                    category: 'PAYMENT',
                    subject: `Payment Reminder - Order #${order.orderNumber}`,
                    message: `Please pay $${order.totalAmount} for order #${order.orderNumber}`,
                    recipient: customer.phone,
                    relatedOrderId: orderId,
                    status: 'SENT',
                    sentAt: new Date()
                });

                logger.info(`Payment reminder sent for order: ${orderId}`);
            }
        } catch (error) {
            logger.error("Send payment reminder error:", error.message);
        }
    }
};

import mongoose from "mongoose";

const lowStockAlertSchema = new mongoose.Schema({
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    itemName: String,
    currentStock: Number,
    reorderLevel: Number,
    alertSentAt: Date,
    alertsSent: { type: Number, default: 1 },
    isResolved: { type: Boolean, default: false },
    resolvedAt: Date,
    notificationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }]
}, { timestamps: true });

lowStockAlertSchema.index({ branchId: 1, isResolved: 1 });
lowStockAlertSchema.index({ alertSentAt: -1 });

const LowStockAlert = mongoose.model("LowStockAlert", lowStockAlertSchema);
export default LowStockAlert;

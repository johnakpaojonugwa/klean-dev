import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const generateShortId = customAlphabet("1234567890ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        index: true,
        default: () => `ORD-${generateShortId()}`
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },

    items: [{
        itemType: { type: String, required: true },
        quantity: { type: Number, min: 1, required: true },
        unitPrice: { type: Number, min: 0, required: true },
        subtotal: { type: Number, default: 0 },
        specialInstructions: { type: String }
    }],

    serviceType: {
        type: String,
        enum: ['WASH_FOLD', 'IRONING', 'DRY_CLEANING', 'STAIN_REMOVAL', 'ALTERATIONS'],
        default: 'WASH_FOLD'
    },

    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },

    statusHistory: [{
        status: String,
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    priority: { type: String, enum: ['NORMAL', 'EXPRESS', 'URGENT'], default: 'NORMAL' },
    pickupDate: { type: Date },
    deliveryDate: { type: Date },

    paymentMethod: { type: String, enum: ['CASH', 'POS', 'TRANSFER', 'WALLET'], default: 'CASH' },
    paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },

    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for optimal query performance
orderSchema.index({ branchId: 1, status: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ branchId: 1, createdAt: -1 }); // For daily analytics queries
orderSchema.index({ createdAt: -1, paymentStatus: 1 }); // For revenue calculations
orderSchema.index({ paymentStatus: 1 }); // For payment status filters
orderSchema.index({ status: 1, createdAt: -1 }); // For status-based reports

// PRE-SAVE: Financial Calculations Only
orderSchema.pre('save', function() {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            updatedAt: new Date(),
            updatedBy: this._updatedBy || this.createdBy
        });
    }

    if (this.isModified('items') || this.isModified('priority') || this.isModified('discount')) {
        let itemsTotal = 0;

        this.items.forEach(item => {
            item.subtotal = (item.quantity || 0) * (item.unitPrice || 0);
            itemsTotal += item.subtotal;
        });

        this.itemsTotal = itemsTotal;

        const multipliers = { 'URGENT': 1.5, 'EXPRESS': 1.25, 'NORMAL': 1 };
        const multiplier = multipliers[this.priority] || 1;

        this.subtotal = itemsTotal * multiplier;

        // Tax calculation (e.g., 7.5%)
        this.tax = Math.round((this.subtotal * 0.075) * 100) / 100;

        const final = (this.subtotal + this.tax) - this.discount;
        this.totalAmount = Math.max(0, Math.round(final * 100) / 100);
    }
    // Removed next() — Mongoose 6+ uses Promise-based hooks
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    
    // Order metrics
    totalOrders: { type: Number, default: 0 },
    totalOrderValue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    ordersCompleted: { type: Number, default: 0 },
    ordersCancelled: { type: Number, default: 0 },
    
    // Order status breakdown
    ordersByStatus: {
        PENDING: { type: Number, default: 0 },
        PROCESSING: { type: Number, default: 0 },
        WASHING: { type: Number, default: 0 },
        DRYING: { type: Number, default: 0 },
        IRONING: { type: Number, default: 0 },
        READY: { type: Number, default: 0 },
        DELIVERED: { type: Number, default: 0 },
        CANCELLED: { type: Number, default: 0 }
    },
    
    // Payment metrics
    totalRevenue: { type: Number, default: 0 },
    paidOrders: { type: Number, default: 0 },
    unpaidOrders: { type: Number, default: 0 },
    partiallyPaidOrders: { type: Number, default: 0 },
    averagePaymentTime: { type: Number, default: 0 }, // in hours
    
    // Customer metrics
    newCustomers: { type: Number, default: 0 },
    returningCustomers: { type: Number, default: 0 },
    totalActiveCustomers: { type: Number, default: 0 },
    
    // Staff metrics
    activeStaff: { type: Number, default: 0 },
    ordersProcessedByStaff: { type: Number, default: 0 },
    averageProcessingTime: { type: Number, default: 0 }, // in hours
    
    // Inventory metrics
    lowStockAlerts: { type: Number, default: 0 },
    itemsOutOfStock: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    
    // Customer satisfaction (optional)
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    
    // Peak hours (comma-separated hour numbers: 9,12,17)
    peakOrderHours: String,
    
    // Notes
    notes: String
}, { timestamps: true });

// Indexes for optimal analytics query performance
analyticsSchema.index({ date: 1, branchId: 1 }, { unique: true }); // Unique compound index
analyticsSchema.index({ date: -1 }); // For recent records sorting
analyticsSchema.index({ branchId: 1, date: -1 }); // For branch-specific date queries
analyticsSchema.index({ date: 1 }, { expireAfterSeconds: 7776000 }); // Auto-expire after 90 days

const Analytics = mongoose.model("Analytics", analyticsSchema);
export default Analytics;

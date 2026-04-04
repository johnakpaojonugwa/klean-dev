import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    // Operation info
    operationType: { type: String, required: true, index: true }, // 'payment-status-update', 'order-delete', etc.
    description: { type: String },
    
    // User info
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userRole: { type: String }, // Snapshot of role at time of action
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    
    // Request info
    ip: { type: String },
    endpoint: { type: String },
    
    // Changes
    affectedResource: { type: mongoose.Schema.Types.ObjectId, index: true }, // The order/user being modified
    changes: { type: mongoose.Schema.Types.Mixed }, // What changed (before/after or just the values)
    
    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true, expires: 7776000 } // Auto-expire after 90 days
}, { timestamps: true });

// Compound index for common queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ operationType: 1, createdAt: -1 });
auditLogSchema.index({ branchId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

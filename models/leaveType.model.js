import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    color: { type: String, default: '#3498db' }, // For UI
    icon: String,
    
    // Leave Configuration
    annualLimit: { type: Number, required: true, min: 0 },
    requiresApproval: { type: Boolean, default: true },
    isUnpaid: { type: Boolean, default: false },
    isDayBased: { type: Boolean, default: true }, // vs hour-based
    
    // Rules
    maxConsecutiveDays: { type: Number, default: null }, // null = no limit
    carryForwardDays: { type: Number, default: 0 },
    encashable: { type: Boolean, default: false },
    
    // Status
    isActive: { type: Boolean, default: true },
    
    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    
}, { timestamps: true });

leaveTypeSchema.index({ isActive: 1 });

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);
export default LeaveType;

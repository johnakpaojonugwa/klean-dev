import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
    // References
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    
    // Leave Dates
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true, min: 0.5 },
    
    // Leave Details
    reason: { type: String, required: true },
    description: String,
    
    // Status
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING'
    },
    
    // Approval Information
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: Date,
    rejectionReason: String,
    
    // Half Day Information
    isHalfDay: { type: Boolean, default: false },
    halfDayPeriod: {
        type: String,
        enum: ['MORNING', 'AFTERNOON'],
        validate: {
            validator: function() {
                return !this.isHalfDay || this.halfDayPeriod;
            },
            message: 'Half day period is required if it is a half day'
        }
    },
    
    // Contact Details During Leave
    contactNumber: String,
    
    // Documents
    attachments: [String], // File paths
    
    // Audit
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    
}, { timestamps: true });

// Index for faster queries
leaveSchema.index({ employeeId: 1 });
leaveSchema.index({ branchId: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

// Calculate number of days automatically
leaveSchema.pre('save', function(next) {
    if (this.startDate && this.endDate) {
        const timeDiff = this.endDate - this.startDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
        this.numberOfDays = this.isHalfDay ? 0.5 : daysDiff;
    }
    next();
});

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;

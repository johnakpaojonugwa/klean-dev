import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
    // References
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    salaryStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    
    // Period
    payrollMonth: { type: Date, required: true }, // Month for which salary is being paid
    paymentDate: Date,
    
    // Attendance Data
    totalWorkingDays: { type: Number, default: 26, min: 0 },
    attendedDays: { type: Number, default: 0, min: 0 },
    leavesTaken: { type: Number, default: 0, min: 0 },
    absentDays: { type: Number, default: 0, min: 0 },
    holidaysCount: { type: Number, default: 0, min: 0 },
    overtimeHours: { type: Number, default: 0, min: 0 },
    
    // Earnings
    baseSalary: { type: Number, required: true, min: 0 },
    houseRentAllowance: { type: Number, default: 0, min: 0 },
    conveyanceAllowance: { type: Number, default: 0, min: 0 },
    dearness: { type: Number, default: 0, min: 0 },
    performanceBonus: { type: Number, default: 0, min: 0 },
    overtimeEarnings: { type: Number, default: 0, min: 0 },
    otherAllowance: { type: Number, default: 0, min: 0 },
    grossSalary: { type: Number, required: true, min: 0 },
    
    // Deductions
    providentFund: { type: Number, default: 0, min: 0 },
    employeeInsurance: { type: Number, default: 0, min: 0 },
    incomeTax: { type: Number, default: 0, min: 0 },
    professionalTax: { type: Number, default: 0, min: 0 },
    advanceAdjustment: { type: Number, default: 0, min: 0 },
    otherDeduction: { type: Number, default: 0, min: 0 },
    totalDeductions: { type: Number, required: true, min: 0 },
    
    // Net Salary
    netSalary: { type: Number, required: true, min: 0 },
    
    // Payment Information
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PROCESSED', 'PAID', 'CANCELLED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['BANK_TRANSFER', 'CASH', 'CHEQUE', 'ONLINE'],
        default: 'BANK_TRANSFER'
    },
    bankTransactionId: String,
    
    // Additional Info
    remarks: String,
    
    // Audit
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
}, { timestamps: true });

// Index for faster queries
payrollSchema.index({ employeeId: 1, payrollMonth: 1 }, { unique: true });
payrollSchema.index({ branchId: 1 });
payrollSchema.index({ paymentStatus: 1 });
payrollSchema.index({ payrollMonth: 1 });
payrollSchema.index({ paymentStatus: 1, paymentDate: 1 });

const Payroll = mongoose.model("Payroll", payrollSchema);
export default Payroll;

import mongoose from "mongoose";

const salaryStructureSchema = new mongoose.Schema({
    // Basic Information
    name: { type: String, required: true },
    description: String,
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    
    // Salary Components
    baseSalary: { type: Number, required: true, min: 0 },
    houseRentAllowance: { type: Number, default: 0, min: 0 },
    conveyanceAllowance: { type: Number, default: 0, min: 0 },
    dearness: { type: Number, default: 0, min: 0 },
    performanceBonus: { type: Number, default: 0, min: 0 },
    otherAllowance: { type: Number, default: 0, min: 0 },
    
    // Deductions
    providentFund: { type: Number, default: 0, min: 0 }, // % of salary
    employeeInsurance: { type: Number, default: 0, min: 0 }, // % of salary
    incomeTax: { type: Number, default: 0, min: 0 }, // % of salary
    professionalTax: { type: Number, default: 0, min: 0 }, // % of salary
    otherDeduction: { type: Number, default: 0, min: 0 }, // % of salary
    
    // Leave Configuration
    annualLeaveBalance: { type: Number, default: 20, min: 0 },
    sickLeaveBalance: { type: Number, default: 10, min: 0 },
    casualLeaveBalance: { type: Number, default: 5, min: 0 },
    paidLeaveDays: { type: Number, default: 30, min: 0 },
    
    // Working Days
    workingDaysPerMonth: { type: Number, default: 26, min: 1 },
    workingHoursPerDay: { type: Number, default: 8, min: 1 },
    
    // Overtime
    overtimeRateMultiplier: { type: Number, default: 1.5, min: 1 }, // 1.5x, 2x, etc.
    
    // Status
    isActive: { type: Boolean, default: true },
    
    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    
}, { timestamps: true });

// Calculate gross salary
salaryStructureSchema.methods.calculateGrossSalary = function() {
    return this.baseSalary + 
           this.houseRentAllowance + 
           this.conveyanceAllowance + 
           this.dearness + 
           this.performanceBonus + 
           this.otherAllowance;
};

// Calculate total deductions (as fixed amount)
salaryStructureSchema.methods.calculateTotalDeductions = function() {
    const gross = this.calculateGrossSalary();
    return (gross * (this.providentFund + this.employeeInsurance + this.incomeTax + this.professionalTax + this.otherDeduction) / 100);
};

// Calculate net salary
salaryStructureSchema.methods.calculateNetSalary = function() {
    return this.calculateGrossSalary() - this.calculateTotalDeductions();
};

salaryStructureSchema.index({ branchId: 1 });
salaryStructureSchema.index({ isActive: 1 });

const SalaryStructure = mongoose.model("SalaryStructure", salaryStructureSchema);
export default SalaryStructure;

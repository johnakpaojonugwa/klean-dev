import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890", 6);

const employeeSchema = new mongoose.Schema({
    // Link to User account
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    salaryStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },

    // Personal Information
    dateOfBirth: Date,
    gender: { type: String, enum: ['MALE', 'FEMALE'] },
    phoneNumber: String,
    alternatePhoneNumber: String,
    address: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,

    // Employment Information
    employeeNumber: {
        type: String,
        unique: true,
        default: () => `EMP-${new Date().getFullYear()}-${nanoid()}`
    },

    designation: { type: String, required: true },
    department: { type: String, required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    joinDate: { type: Date, required: true },

    // Employee Role
    employeeJobRole: {
        type: String,
        enum: ['BRANCH_MANAGER', 'SUPERVISOR', 'WASHER', 'IRONER', 'DRIVER', 'RECEPTIONIST', 'CLEANER'],
        default: 'WASHER'
    },

    // Employee Status
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED'],
        default: 'ACTIVE'
    },

    avatar: String,

    // Tasks
    assignedTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },

    // Performance Rating
    performanceRating: { type: Number, default: 0 },

    // Bank Information
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    ifscCode: String,

    // Tax Information
    panNumber: String,
    aadharNumber: String,
    taxId: String,

    // Employment History
    employmentHistory: [{
        position: String,
        department: String,
        joinDate: Date,
        endDate: Date,
        description: String
    }],

    // Reporting Manager
    reportingManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

    // Emergency Contact
    emergencyContactName: String,
    emergencyContactPhone: String,
    emergencyContactRelation: String,

    // Documents
    profilePicture: String,
    resume: String,
    identification: String,

    // Salary Structure Reference
    salaryStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },

    // Additional Notes
    notes: String,

    // Termination Information
    terminationDate: Date,
    terminationReason: String,
    exitNotes: String

}, { timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster queries
employeeSchema.index({ branchId: 1, role: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ reportingManagerId: 1 });

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;

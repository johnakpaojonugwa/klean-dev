import Payroll from "../models/payroll.model.js";
import Employee from "../models/employee.model.js";
import SalaryStructure from "../models/salaryStructure.model.js";
import Leave from "../models/leave.model.js";
import { logger } from "../utils/logger.js";

export const payrollService = {
    // Calculate salary for an employee
    calculateSalary: async (employeeId, payrollMonth) => {
        try {
            const employee = await Employee.findById(employeeId);
            if (!employee) throw new Error("Employee not found");

            const salaryStructure = await SalaryStructure.findById(employee.salaryStructureId);
            if (!salaryStructure) throw new Error("Salary structure not found");

            // Get attendance data
            const startDate = new Date(payrollMonth.getFullYear(), payrollMonth.getMonth(), 1);
            const endDate = new Date(payrollMonth.getFullYear(), payrollMonth.getMonth() + 1, 0);

            const attendance = await Attendance.find({
                employeeId,
                date: { $gte: startDate, $lte: endDate }
            });

            const leaves = await Leave.find({
                employeeId,
                status: 'APPROVED',
                startDate: { $lte: endDate },
                endDate: { $gte: startDate }
            });

            // Calculate attendance metrics
            const attendedDays = attendance.filter(attendance => attendance.status === 'PRESENT').length;
            const halfDays = attendance.filter(attendance => attendance.status === 'HALF_DAY').length;
            const absentDays = attendance.filter(attendance => attendance.status === 'ABSENT').length;
            const leavesTaken = leaves.reduce((total, leave) => total + leave.numberOfDays, 0);
            const totalWorkingDays = salaryStructure.workingDaysPerMonth;

            // Calculate overtime
            const overtimeHours = attendance.reduce((total, att) => {
                return total + (att.overtimeHours || 0);
            }, 0);

            // Calculate earnings
            const baseSalary = salaryStructure.baseSalary;
            const grossSalary = salaryStructure.calculateGrossSalary();
            const dailyRate = grossSalary / totalWorkingDays;

            // Deduct absent days from salary
            const salaryAfterAttendance = grossSalary - (absentDays * dailyRate) - (halfDays * dailyRate * 0.5);

            // Add overtime
            const overtimeRate = (baseSalary / (salaryStructure.workingDaysPerMonth * salaryStructure.workingHoursPerDay)) * salaryStructure.overtimeRateMultiplier;
            const overtimeEarnings = overtimeHours * overtimeRate;

            // Calculate deductions (as percentage of gross)
            const providentFund = (salaryAfterAttendance + overtimeEarnings) * (salaryStructure.providentFund / 100);
            const employeeInsurance = (salaryAfterAttendance + overtimeEarnings) * (salaryStructure.employeeInsurance / 100);
            const incomeTax = (salaryAfterAttendance + overtimeEarnings) * (salaryStructure.incomeTax / 100);
            const professionalTax = (salaryAfterAttendance + overtimeEarnings) * (salaryStructure.professionalTax / 100);
            const otherDeduction = (salaryAfterAttendance + overtimeEarnings) * (salaryStructure.otherDeduction / 100);

            const totalDeductions = providentFund + employeeInsurance + incomeTax + professionalTax + otherDeduction;

            const netSalary = salaryAfterAttendance + overtimeEarnings - totalDeductions;

            return {
                attendedDays,
                leavesTaken,
                absentDays,
                halfDays: halfDays * 0.5, // Half days counted as 0.5
                totalWorkingDays,
                overtimeHours,
                baseSalary,
                houseRentAllowance: salaryStructure.houseRentAllowance,
                conveyanceAllowance: salaryStructure.conveyanceAllowance,
                dearness: salaryStructure.dearness,
                performanceBonus: salaryStructure.performanceBonus,
                overtimeEarnings: Math.round(overtimeEarnings * 100) / 100,
                otherAllowance: salaryStructure.otherAllowance,
                grossSalary: Math.round(salaryAfterAttendance * 100) / 100,
                providentFund: Math.round(providentFund * 100) / 100,
                employeeInsurance: Math.round(employeeInsurance * 100) / 100,
                incomeTax: Math.round(incomeTax * 100) / 100,
                professionalTax: Math.round(professionalTax * 100) / 100,
                otherDeduction: Math.round(otherDeduction * 100) / 100,
                totalDeductions: Math.round(totalDeductions * 100) / 100,
                netSalary: Math.round(netSalary * 100) / 100
            };
        } catch (error) {
            logger.error("Salary calculation error:", error.message);
            throw error;
        }
    },

    // Generate salary slip
    generateSalarySlip: async (payrollId) => {
        try {
            const payroll = await Payroll.findById(payrollId)
                .populate('employeeId')
                .populate('salaryStructureId');

            if (!payroll) throw new Error("Payroll record not found");

            const slip = {
                payrollNumber: payroll._id,
                employeeNumber: payroll.employeeId.employeeNumber,
                employeeName: payroll.employeeId.designation,
                payrollMonth: payroll.payrollMonth,
                
                earnings: {
                    baseSalary: payroll.baseSalary,
                    houseRentAllowance: payroll.houseRentAllowance,
                    conveyanceAllowance: payroll.conveyanceAllowance,
                    dearness: payroll.dearness,
                    performanceBonus: payroll.performanceBonus,
                    overtimeEarnings: payroll.overtimeEarnings,
                    otherAllowance: payroll.otherAllowance,
                    grossSalary: payroll.grossSalary
                },
                
                deductions: {
                    providentFund: payroll.providentFund,
                    employeeInsurance: payroll.employeeInsurance,
                    incomeTax: payroll.incomeTax,
                    professionalTax: payroll.professionalTax,
                    advanceAdjustment: payroll.advanceAdjustment,
                    otherDeduction: payroll.otherDeduction,
                    totalDeductions: payroll.totalDeductions
                },
                
                netSalary: payroll.netSalary,
                
                attendance: {
                    totalWorkingDays: payroll.totalWorkingDays,
                    attendedDays: payroll.attendedDays,
                    leavesTaken: payroll.leavesTaken,
                    absentDays: payroll.absentDays,
                    overtimeHours: payroll.overtimeHours
                },
                
                paymentInfo: {
                    status: payroll.paymentStatus,
                    method: payroll.paymentMethod,
                    date: payroll.paymentDate
                }
            };

            return slip;
        } catch (error) {
            logger.error("Salary slip generation error:", error.message);
            throw error;
        }
    },

    // Process payroll for all employees in a branch
    processPayrollForBranch: async (branchId, payrollMonth, processedBy) => {
        try {
            const employees = await Employee.find({
                branchId,
                status: 'ACTIVE'
            });

            const payrolls = [];

            for (const employee of employees) {
                // Check if payroll already exists for this month
                const existingPayroll = await Payroll.findOne({
                    employeeId: employee._id,
                    payrollMonth: new Date(payrollMonth.getFullYear(), payrollMonth.getMonth(), 1)
                });

                if (existingPayroll) {
                    logger.warn(`Payroll already exists for employee ${employee.employeeNumber}`);
                    continue;
                }

                // Calculate salary
                const salaryData = await payrollService.calculateSalary(employee._id, payrollMonth);

                // Create payroll record
                const payroll = await Payroll.create({
                    employeeId: employee._id,
                    salaryStructureId: employee.salaryStructureId,
                    branchId,
                    payrollMonth: new Date(payrollMonth.getFullYear(), payrollMonth.getMonth(), 1),
                    ...salaryData,
                    processedBy
                });

                payrolls.push(payroll);
            }

            logger.info(`Payroll processed for ${payrolls.length} employees in branch ${branchId}`);
            return payrolls;
        } catch (error) {
            logger.error("Payroll processing error:", error.message);
            throw error;
        }
    }
};

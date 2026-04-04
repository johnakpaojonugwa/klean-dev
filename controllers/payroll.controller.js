import Payroll from "../models/payroll.model.js";
import Employee from "../models/employee.model.js";
import SalaryStructure from "../models/salaryStructure.model.js";
import { payrollService } from "../services/payrollService.js";
import { sendResponse, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { isValidObjectId, sanitizeInput } from "../utils/validators.js";

// Process Payroll for Employee
export const processPayroll = async (req, res, next) => {
    try {
        // Authorization: only payroll/HR admins
        if (!['SUPER_ADMIN', 'BRANCH_MANAGER'].includes(req.user?.role)) {
            return sendError(res, 403, "Unauthorized to process payroll");
        }

        const { employeeId, payrollMonth } = req.body;

        if (!employeeId || !isValidObjectId(employeeId)) {
            return sendError(res, 400, "Valid employee ID is required");
        }

        if (!payrollMonth || isNaN(new Date(payrollMonth).getTime())) {
            return sendError(res, 400, "Valid payroll month is required (YYYY-MM format)");
        }

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return sendError(res, 404, "Employee not found");
        }

        // Branch managers can only process for their branch
        if (req.user.role === 'BRANCH_MANAGER' && String(employee.branchId) !== String(req.user.branchId)) {
            return sendError(res, 403, "You can only process payroll for your branch");
        }

        // Check if salary structure exists
        if (!employee.salaryStructureId) {
            return sendError(res, 400, "Employee does not have a salary structure assigned");
        }

        // Check if payroll already exists for this month
        const month = new Date(payrollMonth);
        const existingPayroll = await Payroll.findOne({
            employeeId,
            payrollMonth: {
                $gte: new Date(month.getFullYear(), month.getMonth(), 1),
                $lt: new Date(month.getFullYear(), month.getMonth() + 1, 1)
            }
        });

        if (existingPayroll) {
            return sendError(res, 409, "Payroll already processed for this month");
        }

        // Calculate salary
        const salaryData = await payrollService.calculateSalary(employeeId, month);

        // Create payroll record
        const payroll = await Payroll.create({
            employeeId,
            salaryStructureId: employee.salaryStructureId,
            branchId: employee.branchId,
            payrollMonth: month,
            ...salaryData,
            paymentStatus: 'PENDING',
            processedBy: req.user.id
        });

        logger.info(`Payroll processed by ${req.user.id} for employee ${employee.employeeNumber}`);

        return sendResponse(res, 201, true, "Payroll processed successfully", { payroll });
    } catch (error) {
        logger.error("Process payroll error:", error.message);
        next(error);
    }
};

// Process Payroll for Branch
export const processPayrollForBranch = async (req, res, next) => {
    try {
        // Authorization
        if (!['SUPER_ADMIN', 'BRANCH_MANAGER'].includes(req.user?.role)) {
            return sendError(res, 403, "Unauthorized to process payroll");
        }

        const { branchId, payrollMonth } = req.body;

        if (!branchId || !isValidObjectId(branchId)) {
            return sendError(res, 400, "Valid branch ID is required");
        }

        if (!payrollMonth || isNaN(new Date(payrollMonth).getTime())) {
            return sendError(res, 400, "Valid payroll month is required");
        }

        // Branch managers can only process for their branch
        if (req.user.role === 'BRANCH_MANAGER' && String(req.user.branchId) !== String(branchId)) {
            return sendError(res, 403, "You can only process payroll for your branch");
        }

        const payrolls = await payrollService.processPayrollForBranch(
            branchId,
            new Date(payrollMonth),
            req.user.id
        );

        logger.info(`Payroll processed for branch ${branchId} by ${req.user.id}`);

        return sendResponse(res, 201, true, "Payroll processed for branch", {
            count: payrolls.length,
            payrolls
        });
    } catch (error) {
        logger.error("Process branch payroll error:", error.message);
        next(error);
    }
};

// Get Payroll Records
export const getPayrolls = async (req, res, next) => {
    try {
        const { employeeId, branchId, month, status, page = 1, limit = 10 } = req.query;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, parseInt(limit) || 10);

        let query = {};

        // Authorization
        if (req.user.role === 'BRANCH_MANAGER') {
            query.branchId = req.user.branchId;
        } else if (req.user.role !== 'SUPER_ADMIN') {
            return sendError(res, 403, "Unauthorized to view payrolls");
        }

        if (employeeId && isValidObjectId(employeeId)) query.employeeId = employeeId;
        if (branchId && isValidObjectId(branchId)) query.branchId = branchId;
        if (status && ['PENDING', 'PROCESSED', 'PAID', 'REJECTED'].includes(status)) query.paymentStatus = status;
        
        // Filter by month if provided
        if (month && /^\d{4}-\d{2}$/.test(month)) {
            const [year, monthNum] = month.split('-').map(Number);
            if (monthNum >= 1 && monthNum <= 12) {
                const startDate = new Date(year, monthNum - 1, 1);
                const endDate = new Date(year, monthNum, 0);
                query.payrollMonth = { $gte: startDate, $lte: endDate };
            }
        }

        const skip = (pageNum - 1) * limitNum;

        const payrolls = await Payroll.find(query)
            .populate('employeeId', 'employeeNumber fullname')
            .populate('salaryStructureId', 'name')
            .skip(skip)
            .limit(limitNum)
            .sort({ payrollMonth: -1 })
            .lean(); // Optimize read-only query

        const total = await Payroll.countDocuments(query);

        return sendResponse(res, 200, true, "Payrolls retrieved", {
            total,
            page: pageNum,
            limit: limitNum,
            payrolls
        });
    } catch (error) {
        logger.error("Get payrolls error:", error.message);
        next(error);
    }
};

// Get Single Payroll
export const getPayroll = async (req, res, next) => {
    try {
        const { payrollId } = req.params;

        if (!isValidObjectId(payrollId)) {
            return sendError(res, 400, "Invalid payroll ID format");
        }

        const payroll = await Payroll.findById(payrollId)
            .populate('employeeId')
            .populate('salaryStructureId')
            .populate('processedBy', 'fullname email')
            .populate('approvedBy', 'fullname email');

        if (!payroll) {
            return sendError(res, 404, "Payroll not found");
        }

        // Authorization: branch managers can only see their branch's payrolls
        if (req.user.role === 'BRANCH_MANAGER' && String(payroll.branchId) !== String(req.user.branchId)) {
            return sendError(res, 403, "Unauthorized");
        }

        return sendResponse(res, 200, true, "Payroll retrieved", { payroll });
    } catch (error) {
        logger.error("Get payroll error:", error.message);
        next(error);
    }
};

// Approve Payroll
export const approvePayroll = async (req, res, next) => {
    try {
        const { payrollId } = req.params;

        // Only SUPER_ADMIN can approve
        if (req.user?.role !== 'SUPER_ADMIN') {
            return sendError(res, 403, "Only admins can approve payroll");
        }

        if (!isValidObjectId(payrollId)) {
            return sendError(res, 400, "Invalid payroll ID format");
        }

        const payroll = await Payroll.findByIdAndUpdate(
            payrollId,
            { $set: { paymentStatus: 'PROCESSED', approvedBy: req.user.id, approvedAt: new Date() } },
            { new: true }
        ).populate('employeeId', 'employeeNumber fullname');

        if (!payroll) {
            return sendError(res, 404, "Payroll not found");
        }

        logger.info(`Payroll approved by ${req.user.id}: ${payroll.employeeId.employeeNumber}`);

        return sendResponse(res, 200, true, "Payroll approved", { payroll });
    } catch (error) {
        logger.error("Approve payroll error:", error.message);
        next(error);
    }
};

// Mark Payroll as Paid
export const markPayrollAsPaid = async (req, res, next) => {
    try {
        const { payrollId } = req.params;
        const { paymentDate, paymentMethod, bankTransactionId } = req.body;

        // Only admins can mark as paid
        if (!['SUPER_ADMIN', 'BRANCH_MANAGER'].includes(req.user?.role)) {
            return sendError(res, 403, "Unauthorized to mark payroll as paid");
        }

        if (!isValidObjectId(payrollId)) {
            return sendError(res, 400, "Invalid payroll ID format");
        }

        if (!paymentDate || isNaN(new Date(paymentDate).getTime())) {
            return sendError(res, 400, "Valid payment date is required");
        }

        if (!paymentMethod || !['BANK_TRANSFER', 'CHECK', 'CASH', 'OTHER'].includes(paymentMethod)) {
            return sendError(res, 400, "Valid payment method is required");
        }

        const payroll = await Payroll.findById(payrollId);
        if (!payroll) {
            return sendError(res, 404, "Payroll not found");
        }

        // Branch managers can only update their branch's payroll
        if (req.user.role === 'BRANCH_MANAGER' && String(payroll.branchId) !== String(req.user.branchId)) {
            return sendError(res, 403, "You can only mark payroll as paid for your branch");
        }

        const updatedPayroll = await Payroll.findByIdAndUpdate(
            payrollId,
            {
                $set: {
                    paymentStatus: 'PAID',
                    paymentDate: new Date(paymentDate),
                    paymentMethod,
                    bankTransactionId: sanitizeInput(bankTransactionId || '')
                }
            },
            { new: true }
        ).populate('employeeId', 'employeeNumber fullname');

        logger.info(`Payroll marked as paid by ${req.user.id}: ${updatedPayroll.employeeId.employeeNumber}`);
        return sendResponse(res, 200, true, "Payroll marked as paid", { payroll: updatedPayroll });
    } catch (error) {
        logger.error("Mark payroll as paid error:", error.message);
        next(error);
    }
};

// Generate Salary Slip (JSON)
export const generateSalarySlip = async (req, res, next) => {
    try {
        const { payrollId } = req.params;
        if (!isValidObjectId(payrollId)) {
            return sendError(res, 400, "Invalid payroll ID format");
        }

        // authorization: branch managers only their branch
        const slip = await payrollService.generateSalarySlip(payrollId);
        const payrollRecord = await Payroll.findById(payrollId);
        if (!payrollRecord) {
            return sendError(res, 404, "Payroll not found");
        }
        if (req.user.role === 'BRANCH_MANAGER' && String(payrollRecord.branchId) !== String(req.user.branchId)) {
            return sendError(res, 403, "Unauthorized");
        }

        return sendResponse(res, 200, true, "Salary slip generated", { slip });
    } catch (error) {
        logger.error("Generate salary slip error:", error.message);
        next(error);
    }
};

// Salary structure controllers
export const createSalaryStructure = async (req, res, next) => {
    try {
        // only super admin allowed (route already protects but double-check)
        if (req.user?.role !== 'SUPER_ADMIN') {
            return sendError(res, 403, "Unauthorized to create salary structure");
        }

        const payload = req.body;
        const { name, branchId, baseSalary } = payload;
        if (!name || !branchId || typeof baseSalary === 'undefined') {
            return sendError(res, 400, "name, branchId and baseSalary are required");
        }
        if (!isValidObjectId(branchId)) {
            return sendError(res, 400, "Invalid branch ID format");
        }
        // sanitize strings
        payload.name = sanitizeInput(name);
        if (payload.description) payload.description = sanitizeInput(payload.description);

        payload.createdBy = req.user.id;

        const structure = await SalaryStructure.create(payload);
        return sendResponse(res, 201, true, "Salary structure created", { structure });
    } catch (error) {
        logger.error("Create salary structure error:", error.message);
        next(error);
    }
};

export const getSalaryStructures = async (req, res, next) => {
    try {
        const { branchId, isActive } = req.query;
        let query = {};

        if (req.user.role === 'BRANCH_MANAGER') {
            query.branchId = req.user.branchId;
        } else if (branchId && isValidObjectId(branchId)) {
            query.branchId = branchId;
        }

        if (typeof isActive !== 'undefined') {
            query.isActive = isActive === 'true';
        }

        const structures = await SalaryStructure.find(query).sort({ createdAt: -1 }).lean(); // Optimize read-only query
        return sendResponse(res, 200, true, "Salary structures retrieved", { structures });
    } catch (error) {
        logger.error("Get salary structures error:", error.message);
        next(error);
    }
};

export const updateSalaryStructure = async (req, res, next) => {
    try {
        if (req.user?.role !== 'SUPER_ADMIN') {
            return sendError(res, 403, "Unauthorized to update salary structure");
        }
        const { structureId } = req.params;
        if (!isValidObjectId(structureId)) {
            return sendError(res, 400, "Invalid structure ID format");
        }
        const updates = { ...req.body };
        if (updates.name) updates.name = sanitizeInput(updates.name);
        if (updates.description) updates.description = sanitizeInput(updates.description);
        if (updates.branchId && !isValidObjectId(updates.branchId)) {
            return sendError(res, 400, "Invalid branch ID format");
        }

        updates.updatedBy = req.user.id;

        const structure = await SalaryStructure.findByIdAndUpdate(structureId, { $set: updates }, { new: true });
        if (!structure) {
            return sendError(res, 404, "Salary structure not found");
        }
        return sendResponse(res, 200, true, "Salary structure updated", { structure });
    } catch (error) {
        logger.error("Update salary structure error:", error.message);
        next(error);
    }
};

import Leave from "../models/leave.model.js";
import LeaveType from "../models/leaveType.model.js";
import Employee from "../models/employee.model.js";
import { sendResponse, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

// Create Leave Type
export const createLeaveType = async (req, res, next) => {
    try {
        const { name, annualLimit } = req.body;

        if (!name || !annualLimit) {
            return sendError(res, 400, "Name and annual limit are required");
        }

        const leaveType = await LeaveType.create({
            ...req.body,
            createdBy: req.user.id
        });

        logger.info(`Leave type created: ${leaveType.name}`);

        return sendResponse(res, 201, true, "Leave type created", { leaveType });
    } catch (error) {
        logger.error("Create leave type error:", error.message);
        next(error);
    }
};

// Get Leave Types
export const getLeaveTypes = async (req, res, next) => {
    try {
        const { isActive } = req.query;

        let query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const leaveTypes = await LeaveType.find(query).lean(); // Optimize read-only query

        return sendResponse(res, 200, true, "Leave types retrieved", { leaveTypes });
    } catch (error) {
        logger.error("Get leave types error:", error.message);
        next(error);
    }
};

// Request Leave
export const requestLeave = async (req, res, next) => {
    try {
        const { employeeId, leaveTypeId, startDate, endDate, reason, description, isHalfDay, halfDayPeriod, contactNumber } = req.body;

        // Validation
        const errors = [];
        if (!employeeId) errors.push("Employee ID is required");
        if (!leaveTypeId) errors.push("Leave type is required");
        if (!startDate || !endDate) errors.push("Start and end dates are required");
        if (!reason) errors.push("Reason is required");

        if (errors.length > 0) {
            return sendError(res, 400, "Validation failed", errors);
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return sendError(res, 400, "Start date cannot be after end date");
        }

        // Check employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return sendError(res, 404, "Employee not found");
        }

        // Check leave type exists
        const leaveType = await LeaveType.findById(leaveTypeId);
        if (!leaveType) {
            return sendError(res, 404, "Leave type not found");
        }

        // Check for overlapping leaves
        const overlappingLeaves = await Leave.findOne({
            employeeId,
            status: { $in: ['PENDING', 'APPROVED'] },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        if (overlappingLeaves) {
            return sendError(res, 409, "Leave already exists for the requested period");
        }

        const leave = await Leave.create({
            employeeId,
            leaveTypeId,
            branchId: employee.branchId,
            startDate,
            endDate,
            reason,
            description,
            isHalfDay,
            halfDayPeriod,
            contactNumber
        });

        logger.info(`Leave request created for employee ${employee.employeeNumber}`);

        return sendResponse(res, 201, true, "Leave request submitted", { leave });
    } catch (error) {
        logger.error("Request leave error:", error.message);
        next(error);
    }
};

// Get Leave Requests
export const getLeaves = async (req, res, next) => {
    try {
        const { employeeId, branchId, status, startDate, endDate, page = 1, limit = 10 } = req.query;

        let query = {};
        if (employeeId) query.employeeId = employeeId;
        if (branchId) query.branchId = branchId;
        if (status) query.status = status;

        // Date range filter
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const leaves = await Leave.find(query)
            .populate('employeeId', 'employeeNumber fullname')
            .populate('leaveTypeId', 'name')
            .populate('approvedBy', 'fullname')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ startDate: -1 })
            .lean(); // Optimize read-only query

        const total = await Leave.countDocuments(query);

        return sendResponse(res, 200, true, "Leave requests retrieved", {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            leaves
        });
    } catch (error) {
        logger.error("Get leaves error:", error.message);
        next(error);
    }
};

// Get Single Leave
export const getLeave = async (req, res, next) => {
    try {
        const { leaveId } = req.params;

        const leave = await Leave.findById(leaveId)
            .populate('employeeId')
            .populate('leaveTypeId')
            .populate('approvedBy', 'fullname');

        if (!leave) {
            return sendError(res, 404, "Leave request not found");
        }

        return sendResponse(res, 200, true, "Leave retrieved", { leave });
    } catch (error) {
        logger.error("Get leave error:", error.message);
        next(error);
    }
};

// Approve Leave
export const approveLeave = async (req, res, next) => {
    try {
        const { leaveId } = req.params;

        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            {
                $set: {
                    status: 'APPROVED',
                    approvedBy: req.user.id,
                    approvalDate: new Date()
                }
            },
            { new: true }
        ).populate('employeeId');

        if (!leave) {
            return sendError(res, 404, "Leave request not found");
        }

        logger.info(`Leave approved for employee ${leave.employeeId.employeeNumber}`);

        return sendResponse(res, 200, true, "Leave approved", { leave });
    } catch (error) {
        logger.error("Approve leave error:", error.message);
        next(error);
    }
};

// Reject Leave
export const rejectLeave = async (req, res, next) => {
    try {
        const { leaveId } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return sendError(res, 400, "Rejection reason is required");
        }

        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            {
                $set: {
                    status: 'REJECTED',
                    rejectionReason,
                    approvedBy: req.user.id,
                    approvalDate: new Date()
                }
            },
            { new: true }
        ).populate('employeeId');

        if (!leave) {
            return sendError(res, 404, "Leave request not found");
        }

        logger.info(`Leave rejected for employee ${leave.employeeId.employeeNumber}`);

        return sendResponse(res, 200, true, "Leave rejected", { leave });
    } catch (error) {
        logger.error("Reject leave error:", error.message);
        next(error);
    }
};

// Cancel Leave
export const cancelLeave = async (req, res, next) => {
    try {
        const { leaveId } = req.params;

        const leave = await Leave.findById(leaveId);

        if (!leave) {
            return sendError(res, 404, "Leave request not found");
        }

        if (leave.status === 'COMPLETED') {
            return sendError(res, 400, "Cannot cancel a completed leave");
        }

        leave.status = 'CANCELLED';
        await leave.save();

        logger.info(`Leave cancelled for employee ${leave.employeeId}`);

        return sendResponse(res, 200, true, "Leave cancelled", { leave });
    } catch (error) {
        logger.error("Cancel leave error:", error.message);
        next(error);
    }
};

// Get Leave Balance
export const getLeaveBalance = async (req, res, next) => {
    try {
        const { employeeId } = req.params;

        const employee = await Employee.findById(employeeId).populate('salaryStructureId');
        if (!employee) {
            return sendError(res, 404, "Employee not found");
        }

        // Get all approved leaves for current year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        const approvedLeaves = await Leave.find({
            employeeId,
            status: 'APPROVED',
            startDate: { $gte: startOfYear, $lte: endOfYear }
        }).lean(); // Optimize read-only query

        const leaveTaken = approvedLeaves.reduce((total, leave) => total + leave.numberOfDays, 0);

        const balance = {
            annual: (employee.salaryStructureId?.annualLeaveBalance || 20) - leaveTaken,
            sick: employee.salaryStructureId?.sickLeaveBalance || 10,
            casual: employee.salaryStructureId?.casualLeaveBalance || 5
        };

        return sendResponse(res, 200, true, "Leave balance retrieved", { balance, leaveTaken });
    } catch (error) {
        logger.error("Get leave balance error:", error.message);
        next(error);
    }
};

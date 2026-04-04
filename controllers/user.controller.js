import User from "../models/user.model.js";
import Branch from "../models/branch.model.js";
import { sendResponse, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { sanitizeForRegex } from "../utils/validators.js";
import mongoose from "mongoose";

// Create new user
export const createUser = async (req, res, next) => {
    try {
        const { fullname, email, phoneNumber, password, address, role, branchId } = req.body;
        const avatar = req.files?.avatar?.[0]?.path;

        let assignedBranchId = branchId;
        if (!assignedBranchId && req.user.role === "BRANCH_MANAGER") {
            assignedBranchId = req.user.branchId;
        }

        if (req.user.role === 'BRANCH_MANAGER' && role === 'BRANCH_MANAGER') {
            return sendError(res, 403, "Branch managers are not allowed to create other branch managers");
        }

        if(role !== 'CUSTOMER' && !assignedBranchId) {
            return sendError(res, 400, "Branch ID is required for non-customer roles");
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingUser) {
            return sendError(res, 400, "Email or Phone number already in use");
        }

        const newUser = new User({
            fullname,
            email: email.toLowerCase().trim(),
            phoneNumber: phoneNumber.trim(),
            password,
            address: address.trim(),
            role: role || 'CUSTOMER',
            branchId: assignedBranchId || null,
            avatar
        });

        await newUser.save();

        return sendResponse(res, 201, true, "User created successfully", newUser);
    } catch (error) {
        logger.error("Create user error:", error.message);
        next(error);

    }
}

// Create branch manager (SUPER_ADMIN only)
export const createBranchManager = async (req, res, next) => {
    try {
        const {
            fullname,
            email,
            phoneNumber,
            password,
            address,
            designation,
            department,
            branchId
        } = req.body;

        const avatar = req.files?.avatar?.[0]?.path;

        if (!branchId) {
            return sendError(res, 400, "Branch ID is required for branch manager");
        }

        const branch = await Branch.findById(branchId);
        if (!branch) {
            return sendError(res, 404, "Branch not found");
        }

        const existingConflict = await User.findOne({
            $or: [
                { email: email?.toLowerCase()?.trim() },
                { phoneNumber: phoneNumber?.trim() }
            ]
        });
        if (existingConflict) {
            return sendError(res, 400, "Email or Phone number already in use");
        }

        const existingBranchManager = await User.findOne({ role: 'BRANCH_MANAGER', branchId });
        if (existingBranchManager) {
            return sendError(res, 409, "This branch already has an assigned manager");
        }

        const newManager = new User({
            fullname: fullname?.trim(),
            email: email?.toLowerCase()?.trim(),
            phoneNumber: phoneNumber?.trim(),
            password,
            address: address?.trim(),
            role: 'BRANCH_MANAGER',
            designation: designation?.trim(),
            department: department?.trim(),
            branchId,
            avatar,
            status: 'active'
        });

        await newManager.save();

        // Link branch to manager
        branch.manager = newManager._id;
        await branch.save();

        return sendResponse(res, 201, true, "Branch manager created successfully", newManager);
    } catch (error) {
        logger.error("Create branch manager error:", error.message);
        next(error);
    }
};

export const getBranchManagers = async (req, res, next) => {
    try {
        let query = { role: 'BRANCH_MANAGER' };

        if (req.user.role === 'BRANCH_MANAGER') {
            if (!req.user.branchId) return sendError(res, 403, "Manager is not assigned to a branch");
            query.branchId = new mongoose.Types.ObjectId(req.user.branchId);
        }

        if (req.query.branchId) {
            query.branchId = new mongoose.Types.ObjectId(req.query.branchId);
        }

        if (req.query.search) {
            const safeSearch = sanitizeForRegex(req.query.search);
            query.$or = [
                { fullname: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        const [managers, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .populate('branchId', 'name address')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // Optimize read-only query
            User.countDocuments(query)
        ]);

        return sendResponse(res, 200, true, "Branch managers retrieved successfully", {
            pagination: { total, page, pages: Math.ceil(total / limit) },
            managers
        });
    } catch (error) {
        logger.error("Get branch managers error:", error.message);
        next(error);
    }
};

export const getBranchManagerById = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const manager = await User.findById(userId).select('-password').populate('branchId', 'name');

        if (!manager || manager.role !== 'BRANCH_MANAGER') {
            return sendError(res, 404, "Branch manager not found");
        }

        const managerBranchId = manager.branchId?._id ? manager.branchId._id.toString() : manager.branchId?.toString();
        if (req.user.role === 'BRANCH_MANAGER' && managerBranchId !== req.user.branchId?.toString()) {
            return sendError(res, 403, "Access denied");
        }

        return sendResponse(res, 200, true, "Branch manager retrieved", { manager });
    } catch (error) {
        logger.error("Get branch manager by id error:", error.message);
        next(error);
    }
};

export const updateBranchManager = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { fullname, email, phoneNumber, address, designation, department, branchId, status } = req.body;
        const avatar = req.files?.avatar?.[0]?.path;

        const manager = await User.findById(userId);
        if (!manager || manager.role !== 'BRANCH_MANAGER') {
            return sendError(res, 404, "Branch manager not found");
        }

        const updates = {};
        if (fullname) updates.fullname = fullname.trim();
        if (email) updates.email = email.trim().toLowerCase();
        if (phoneNumber) updates.phoneNumber = phoneNumber.trim();
        if (address) updates.address = address.trim();
        if (designation) updates.designation = designation.trim();
        if (department) updates.department = department.trim();
        if (avatar) updates.avatar = avatar;
        if (status) updates.status = status;

        if (branchId && branchId !== manager.branchId?.toString()) {
            const targetBranch = await Branch.findById(branchId);
            if (!targetBranch) {
                return sendError(res, 404, "Target branch not found");
            }

            const existingManager = await User.findOne({ role: 'BRANCH_MANAGER', branchId, _id: { $ne: manager._id } });
            if (existingManager) {
                return sendError(res, 409, "Target branch already has a manager");
            }

            updates.branchId = branchId;

            // Clear previous branch assignment
            if (manager.branchId) {
                await Branch.findByIdAndUpdate(manager.branchId, { $unset: { manager: 1 } });
            }

            targetBranch.manager = manager._id;
            await targetBranch.save();
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, "No changes detected");
        }

        Object.assign(manager, updates);
        await manager.save();

        return sendResponse(res, 200, true, "Branch manager updated", manager);
    } catch (error) {
        if (error.code === 11000) {
            return sendError(res, 400, "Email or Phone number already in use");
        }
        logger.error("Update branch manager error:", error.message);
        next(error);
    }
};

export const deleteBranchManager = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const manager = await User.findById(userId);

        if (!manager || manager.role !== 'BRANCH_MANAGER') {
            return sendError(res, 404, "Branch manager not found");
        }

        if (manager.branchId) {
            await Branch.findByIdAndUpdate(manager.branchId, { $unset: { manager: 1 } });
        }

        await manager.deleteOne();
        return sendResponse(res, 200, true, "Branch manager deleted");
    } catch (error) {
        logger.error("Delete branch manager error:", error.message);
        next(error);
    }
};

// Get all users
export const getAllUsers = async (req, res, next) => {
    try {
        let query = {};

        if (req.user.role === "BRANCH_MANAGER") {
            // Branch managers should only see STAFF, not other managers or admins
            query.role = { $in: ['STAFF'] };
            // Convert branchId to ObjectId for proper MongoDB comparison
            if (req.user.branchId) {
                query.branchId = new mongoose.Types.ObjectId(req.user.branchId);
            }
        } else if (req.user.role === "SUPER_ADMIN") {
            // Super admins see all non-customer roles
            query.role = { $ne: 'CUSTOMER' };
            if (req.query.branchId) {
                query.branchId = new mongoose.Types.ObjectId(req.query.branchId);
            }
        }

        // Search Logic
        if (req.query.search) {
            const safeSearch = sanitizeForRegex(req.query.search);
            query.$or = [
                { fullname: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(query)
                .select("-password -__v")
                .populate("branchId", "name location")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // Optimize read-only query
            User.countDocuments(query)
        ]);

        logger.info(`Users fetched by ${req.user.role}: ${users.length}`);

        return sendResponse(res, 200, true, "Users retrieved successfully", {
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            employees: users
        });
    } catch (error) {
        logger.error("Get all users error:", error.message);
        next(error);
    }
};

// Get all customers
export const getCustomers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        // Validate and safe pagination parameters
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        let query = { role: 'CUSTOMER' };

        // Branch isolation for Customers
        if (req.user.role === "BRANCH_MANAGER") {
            if (!req.user.branchId) return sendError(res, 403, "Manager not assigned to a branch");
            query.branchId = new mongoose.Types.ObjectId(req.user.branchId);
        }

        // Search by name or email
        if (search) {
            const safeSearch = sanitizeForRegex(search);
            query.$or = [
                { fullname: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const [customers, total] = await Promise.all([
            User.find(query)
                .select("-password")
                .limit(limitNum)
                .skip(skip)
                .sort({ createdAt: -1 })
                .lean(), // Optimize read-only query
            User.countDocuments(query)
        ]);

        return sendResponse(res, 200, true, "Customers retrieved successfully", {
            customers,
            pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (error) {
        logger.error("Get customers error:", error.message);
        next(error);
    }
};

// Get single user
export const getSingleUser = async (req, res, next) => {
    try {
        const targetId = req.params.userId || req.user.id;

        const user = await User.findById(targetId).select("-password").populate("branchId", "name");

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        // Authorization checks
        const isOwnProfile = req.user.id === user._id.toString();
        const isSuperAdmin = req.user.role === "SUPER_ADMIN";
        
        const targetBranchId = user.branchId?._id?.toString() || user.branchId?.toString();
        const isBranchManager = req.user.role === "BRANCH_MANAGER" &&
            targetBranchId === req.user.branchId?.toString();

        if (isOwnProfile || isSuperAdmin || isBranchManager) {
            const { _id, fullname, email, phoneNumber, address, role, branchId, avatar } = user;
            
            logger.info("User profile accessed", { accessedBy: req.user.id, targetId: _id });

            return sendResponse(res, 200, true, "User details retrieved", { 
                user: { _id, fullname, email, phoneNumber, address, role, branchId, avatar } 
            });
        }

        return sendError(res, 403, "Access denied: Unauthorized profile access");
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { fullname, email, phoneNumber, address, role, designation, department, branchId } = req.body;
        const avatar = req.files?.avatar?.[0]?.path;

        const user = await User.findById(userId);
        if (!user) return sendError(res, 404, "User not found");

        // Authorization check for Managers
        if (req.user.role === "BRANCH_MANAGER") {
            if (user.branchId?.toString() !== req.user.branchId?.toString()) {
                return sendError(res, 403, "Managers can only update staff in their own branch");
            }
            if (user.role === "SUPER_ADMIN") {
                return sendError(res, 403, "Managers cannot modify Super Admins");
            }
        }

        const updates = {};
        // General Info
        if (fullname) updates.fullname = fullname.trim();
        if (email) updates.email = email.trim().toLowerCase();
        if (phoneNumber) updates.phoneNumber = phoneNumber.trim(); 
        if (address) updates.address = address.trim();
        if (avatar) updates.avatar = avatar;
        if (designation) updates.designation = designation;
        if (department) updates.department = department;

        // Restricted fields (Super Admin only)
        if (req.user.role === "SUPER_ADMIN") {
            if (role) updates.role = role;
            if (branchId !== undefined) updates.branchId = branchId || null;
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, "No changes detected");
        }

        Object.assign(user, updates);
        await user.save();

        return sendResponse(res, 200, true, "Update successful", { user });
    } catch (error) {
        // Handle Mongoose Duplicate Key Error (e.g., email/phone already exists)
        if (error.code === 11000) {
            return sendError(res, 400, "Email or Phone number already in use");
        }
        next(error);
    }
};

// Soft delete user (deactivate)
export const softDelete = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) return sendError(res, 404, "User not found");

        // Protection: Can't deactivate yourself
        if (req.user.id === user._id.toString()) {
            return sendError(res, 400, "You cannot deactivate your own account");
        }

        // Branch Isolation for status change
        if (req.user.role === "BRANCH_MANAGER" && user.branchId?.toString() !== req.user.branchId?.toString()) {
            return sendError(res, 403, "You can only manage status for staff in your branch");
        }

        // Flip status logic
        user.status = user.status === "active" ? "inactive" : "active";
        await user.save();

        logger.info(`User ${userId} status set to ${user.status} by ${req.user.id}`);
        return sendResponse(res, 200, true, `Account status changed to ${user.status}`, { status: user.status });
    } catch (error) {
        next(error);
    }
};

// Permanent delete user
export const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return sendError(res, 404, "User not found");

        if (req.user.role !== "SUPER_ADMIN") {
            return sendError(res, 403, "Hard deletion is restricted to SUPER_ADMIN");
        }

        if (req.user.id === user._id.toString()) {
            return sendError(res, 400, "Self-deletion is not permitted");
        }

        await user.deleteOne();
        return sendResponse(res, 200, true, "User permanently removed from system");
    } catch (error) {
        next(error);
    }
};

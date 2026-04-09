import express from "express";
import {
    createUser,
    getAllUsers,
    getCustomers,
    getSingleUser,
    updateUser,
    softDelete,
    deleteUser,
    updateOwnProfile
} from "../controllers/user.controller.js";
import uploadMiddleware from "../utils/upload.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Apply auth to all user routes
router.use(auth);

// Create a new user
router.post('/', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), uploadMiddleware, asyncHandler(createUser));

// Get all users
router.get('/', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getAllUsers));

// Get all customers
router.get('/customers', authorize('SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF'), asyncHandler(getCustomers));

// Get own profile
router.get('/me', asyncHandler(getSingleUser));

// Update own profile
router.put('/me', uploadMiddleware, asyncHandler(updateOwnProfile));

// Get single user by ID (for admins/managers)
router.get('/:userId', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getSingleUser));

// Update user
router.put('/:userId', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), uploadMiddleware, asyncHandler(updateUser));

// Soft Delete
router.patch('/:userId/status', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(softDelete));

// Delete user
router.delete('/:userId', authorize('SUPER_ADMIN'), asyncHandler(deleteUser));

export default router;

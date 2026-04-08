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

// Route to create a new user
router.post('/', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), uploadMiddleware, asyncHandler(createUser));
// Route to get all users
router.get('/', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getAllUsers));
// Route to get all customers
router.get('/customers', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF'), asyncHandler(getCustomers));
// Route to get singleUser
router.get('/me', auth, asyncHandler(getSingleUser)); // Get own profile
// Route to update own profile
router.put('/me', auth, uploadMiddleware, asyncHandler(updateOwnProfile));
// Route to get single user by ID (for admins/managers)
router.get('/:userId', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getSingleUser));
//Route to update user
router.put('/:userId', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), uploadMiddleware, asyncHandler(updateUser));
// Soft Delete
router.patch('/:userId/status', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(softDelete));
// Route to delete user
router.delete('/:userId', auth, authorize('SUPER_ADMIN'), asyncHandler(deleteUser));

export default router;

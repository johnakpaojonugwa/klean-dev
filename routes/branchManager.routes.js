import express from "express";
import {
    createBranchManager,
    getBranchManagers,
    getBranchManagerById,
    updateBranchManager,
    deleteBranchManager
} from "../controllers/user.controller.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import uploadMiddleware from "../utils/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Apply auth to all branch manager routes
router.use(auth);

// Create branch manager
router.post('/', authorize('SUPER_ADMIN'), uploadMiddleware, asyncHandler(createBranchManager));

// Get branch managers
router.get('/', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getBranchManagers));

// Get single branch manager
router.get('/:userId', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getBranchManagerById));

// Update branch manager
router.put('/:userId', authorize('SUPER_ADMIN'), uploadMiddleware, asyncHandler(updateBranchManager));

// Delete branch manager
router.delete('/:userId', authorize('SUPER_ADMIN'), asyncHandler(deleteBranchManager));

export default router;

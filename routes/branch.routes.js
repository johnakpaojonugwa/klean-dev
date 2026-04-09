import express from "express";
import {
    createBranch,
    getAllBranches,
    getBranchById,
    updateBranch,
    deleteBranch
} from "../controllers/branch.controller.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Apply auth to all branch routes
router.use(auth);

// Create branch (SUPER_ADMIN only)
router.post('/', authorize('SUPER_ADMIN'), asyncHandler(createBranch));

// Get all branches
router.get('/', asyncHandler(getAllBranches));

// Get single branch
router.get('/:branchId', asyncHandler(getBranchById));

// Update branch (SUPER_ADMIN only)
router.put('/:branchId', authorize('SUPER_ADMIN'), asyncHandler(updateBranch));

// Delete branch (SUPER_ADMIN only)
router.delete('/:branchId', authorize('SUPER_ADMIN'), asyncHandler(deleteBranch));

export default router;

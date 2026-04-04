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

// SUPER_ADMIN only routes
router.post('/', auth, authorize('SUPER_ADMIN'), asyncHandler(createBranch));
router.get('/', auth, asyncHandler(getAllBranches));
router.get('/:branchId', auth, asyncHandler(getBranchById));
router.put('/:branchId', auth, authorize('SUPER_ADMIN'), asyncHandler(updateBranch));
router.delete('/:branchId', auth, authorize('SUPER_ADMIN'), asyncHandler(deleteBranch));

export default router;

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

// Branch manager endpoints grouped separately
router.post('/', auth, authorize('SUPER_ADMIN'), uploadMiddleware, asyncHandler(createBranchManager));
router.get('/', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getBranchManagers));
router.get('/:userId', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(getBranchManagerById));
router.put('/:userId', auth, authorize('SUPER_ADMIN'), uploadMiddleware, asyncHandler(updateBranchManager));
router.delete('/:userId', auth, authorize('SUPER_ADMIN'), asyncHandler(deleteBranchManager));

export default router;

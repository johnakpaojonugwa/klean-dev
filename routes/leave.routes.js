import express from 'express';
import { auth, authorize } from '../middlewares/authMiddleware.js';
import {
    createLeaveType,
    getLeaveTypes,
    requestLeave,
    getLeaves,
    getLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    getLeaveBalance
} from '../controllers/leave.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Leave Type Routes
router.post('/type/create', auth, authorize('SUPER_ADMIN'), asyncHandler(createLeaveType));
router.get('/type/list', auth, asyncHandler(getLeaveTypes));

// Leave Request Routes
router.post('/request', auth, asyncHandler(requestLeave));
router.get('/list', auth, asyncHandler(getLeaves));
router.get('/:leaveId', auth, asyncHandler(getLeave));
router.put('/:leaveId/approve', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(approveLeave));
router.put('/:leaveId/reject', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(rejectLeave));
router.put('/:leaveId/cancel', auth, asyncHandler(cancelLeave));

// Leave Balance Route
router.get('/balance/:employeeId', auth, asyncHandler(getLeaveBalance));

export default router;

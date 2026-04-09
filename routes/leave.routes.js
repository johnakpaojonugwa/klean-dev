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

// Apply auth to all leave routes
router.use(auth);

// Leave Type Routes
router.post('/type/create', authorize('SUPER_ADMIN'), asyncHandler(createLeaveType));
router.get('/type/list', asyncHandler(getLeaveTypes));

// Leave Request Routes
router.post('/request', asyncHandler(requestLeave));
router.get('/list', asyncHandler(getLeaves));
router.get('/:leaveId', asyncHandler(getLeave));
router.put('/:leaveId/approve', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(approveLeave));
router.put('/:leaveId/reject', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(rejectLeave));
router.put('/:leaveId/cancel', asyncHandler(cancelLeave));

// Leave Balance Route
router.get('/balance/:employeeId', asyncHandler(getLeaveBalance));

export default router;

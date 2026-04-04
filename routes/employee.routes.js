import express from 'express';
import { auth, authorize } from '../middlewares/authMiddleware.js';
import uploadMiddleware from '../utils/upload.js';
import {
    onboardEmployee,
    getAllEmployees,
    getEmployee,
    updateEmployee,
    terminateEmployee,
    deleteEmployee,
    getEmployeeByUserId
} from '../controllers/employee.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Create Employee (SUPER_ADMIN, BRANCH_MANAGER)
router.post('/', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), uploadMiddleware, asyncHandler(onboardEmployee));

// Get All Employees
router.get('/', auth, asyncHandler(getAllEmployees));

// Get Employee by User ID
router.get('/user/:userId', auth, asyncHandler(getEmployeeByUserId));

// Get Single Employee
router.get('/:employeeId', auth, asyncHandler(getEmployee));

// Update Employee
router.put('/:employeeId', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), uploadMiddleware, asyncHandler(updateEmployee));

// Terminate Employee (SUPER_ADMIN and BRANCH_MANAGER)
router.post('/:employeeId/terminate', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(terminateEmployee));

// Delete Employee (SUPER_ADMIN only)
router.delete('/:employeeId', auth, authorize('SUPER_ADMIN'), asyncHandler(deleteEmployee));

export default router;

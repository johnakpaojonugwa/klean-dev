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

// Apply auth to all employee routes
router.use(auth);

// Create Employee (SUPER_ADMIN, BRANCH_MANAGER)
router.post('/', uploadMiddleware, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(onboardEmployee));

// Get All Employees
router.get('/', asyncHandler(getAllEmployees));

// Get Employee by User ID
router.get('/user/:userId', asyncHandler(getEmployeeByUserId));

// Get Single Employee
router.get('/:employeeId', asyncHandler(getEmployee));

// Update Employee
router.put('/:employeeId', uploadMiddleware, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(updateEmployee));

// Terminate Employee (SUPER_ADMIN and BRANCH_MANAGER)
router.post('/:employeeId/terminate', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(terminateEmployee));

// Delete Employee (SUPER_ADMIN only)
router.delete('/:employeeId', authorize('SUPER_ADMIN'), asyncHandler(deleteEmployee));

export default router;

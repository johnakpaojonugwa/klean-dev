import express from 'express';
import { auth, authorize } from '../middlewares/authMiddleware.js';
import {
    processPayroll,
    processPayrollForBranch,
    getPayrolls,
    getPayroll,
    approvePayroll,
    markPayrollAsPaid,
    generateSalarySlip,
    createSalaryStructure,
    getSalaryStructures,
    updateSalaryStructure
} from '../controllers/payroll.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Apply auth to all payroll routes
router.use(auth);

// Salary Structure Routes
router.post('/structure/create', authorize('SUPER_ADMIN'), asyncHandler(createSalaryStructure));
router.get('/structure/list', asyncHandler(getSalaryStructures));
router.put('/structure/:structureId', authorize('SUPER_ADMIN'), asyncHandler(updateSalaryStructure));

// Payroll Routes
router.post('/process', authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(processPayroll));
router.post('/process-branch', authorize('SUPER_ADMIN'), asyncHandler(processPayrollForBranch));
router.get('/list', asyncHandler(getPayrolls));
router.get('/:payrollId', asyncHandler(getPayroll));
router.put('/:payrollId/approve', authorize('SUPER_ADMIN'), asyncHandler(approvePayroll));
router.put('/:payrollId/mark-paid', authorize('SUPER_ADMIN'), asyncHandler(markPayrollAsPaid));
router.get('/:payrollId/salary-slip', asyncHandler(generateSalarySlip));

export default router;

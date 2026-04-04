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

// Salary Structure Routes
router.post('/structure/create', auth, authorize('SUPER_ADMIN'), asyncHandler(createSalaryStructure));
router.get('/structure/list', auth, asyncHandler(getSalaryStructures));
router.put('/structure/:structureId', auth, authorize('SUPER_ADMIN'), asyncHandler(updateSalaryStructure));

// Payroll Routes
router.post('/process', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(processPayroll));
router.post('/process-branch', auth, authorize('SUPER_ADMIN'), asyncHandler(processPayrollForBranch));
router.get('/list', auth, asyncHandler(getPayrolls));
router.get('/:payrollId', auth, asyncHandler(getPayroll));
router.put('/:payrollId/approve', auth, authorize('SUPER_ADMIN'), asyncHandler(approvePayroll));
router.put('/:payrollId/mark-paid', auth, authorize('SUPER_ADMIN'), asyncHandler(markPayrollAsPaid));
router.get('/:payrollId/salary-slip', auth, asyncHandler(generateSalarySlip));

export default router;

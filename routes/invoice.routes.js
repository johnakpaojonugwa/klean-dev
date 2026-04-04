import express from "express";
import { createInvoice, getInvoiceById, getMyInvoices, downloadInvoice } from "../controllers/invoice.controller.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Managers can create invoices when an order is finalized
router.post('/', auth, authorize('SUPER_ADMIN', 'BRANCH_MANAGER'), asyncHandler(createInvoice));

// Customers can see their own, Managers can see branch invoices
router.get('/my-invoices', auth, asyncHandler(getMyInvoices));

// View specific invoice details
router.get('/:id', auth, asyncHandler(getInvoiceById));

// Download PDF
router.get('/:id/download', auth, asyncHandler(downloadInvoice));

export default router;
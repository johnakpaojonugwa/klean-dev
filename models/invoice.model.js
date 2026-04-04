import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number
    }],
    
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    
    paymentStatus: { 
        type: String, 
        enum: ['UNPAID', 'PARTIAL', 'PAID', 'VOID'], 
        default: 'UNPAID' 
    },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'POS', 'WALLET'] },
    dueDate: Date,
    paidDate: Date,
    notes: String
}, { timestamps: true });

// Index for quick lookups
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customerId: 1, createdAt: -1 });
invoiceSchema.index({ branchId: 1, createdAt: -1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
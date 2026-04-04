import mongoose from "mongoose";

const stockLogSchema = new mongoose.Schema({
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    changeType: { 
        type: String, 
        enum: ['RESTOCK', 'USAGE', 'ADJUSTMENT', 'LOSS', 'RETURN'], 
        required: true 
    },
    quantityChanged: { type: Number, required: true }, // e.g., +10 or -2
    newStockLevel: { type: Number, required: true },
    
    reason: { type: String, trim: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' } // Optional: link to a specific laundry order
}, { timestamps: true });

const StockLog = mongoose.model("StockLog", stockLogSchema);
export default StockLog;
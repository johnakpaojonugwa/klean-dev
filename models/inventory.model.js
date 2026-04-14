import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    itemName: { type: String, required: true },
    category: { type: String, enum: ['DETERGENT', 'SOFTENER', 'STAIN_REMOVAL', 'PACKAGING', 'HANGERS', 'EQUIPMENTS', 'CHEMICALS', 'OTHER'], default: 'OTHER' },
    sku: { type: String, description: 'Stock keeping unit' },
    currentStock: { type: Number, default: 0, min: 0 },
    unit: { type: String, enum: ['kg', 'liters', 'pieces', 'boxes', 'rolls'], default: 'kg' },
    costPerUnit: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    supplierContact: String,
    lastRestocked: { type: Date },
    reorderPending: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

inventorySchema.index({ branchId: 1, itemName: 1 }, { unique: true });
inventorySchema.index({ reorderPending: 1 });
inventorySchema.index({ isActive: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;

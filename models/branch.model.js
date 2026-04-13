import mongoose from "mongoose";

// Branch Schema
const branchSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String }
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    contactNumber: {
        type: String,
        match: [/^\+?[0-9]{7,15}$/, "Invalid phone number"]
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        required: false
    },
    isActive: { type: Boolean, default: true },
    operatingHours: { type: String },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },

    branchCode: {
        type: String,
        required: function () {
            return !this.name;
        },
        unique: true,
        uppercase: true,
        trim: true,
        description: "e.g., NY-01, LON-SHP"
    },
    servicesOffered: [{
        type: String,
        enum: ['WASH_FOLD', 'IRONING', 'DRY_CLEANING', 'STAIN_REMOVAL', 'PICKUP', 'DELIVERY', 'EXPRESS', 'ALTERATIONS']
    }],
}, { timestamps: true });

branchSchema.pre('validate', function(next) {
    // Only generate if branchCode doesn't exist AND we have a name to base it on
    if (!this.branchCode && this.name) {
        this.branchCode = this.name.substring(0, 3).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
    }
    next(); 
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
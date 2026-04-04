import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

// User Schema
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true, select: false },
    address: { type: String, trim: true },
    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'CUSTOMER'],
        default: 'CUSTOMER'
    },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: function () {
            return this.role !== 'CUSTOMER';
        }
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    avatar: String,
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [
        {
            token: { type: String }, // hashed
            createdAt: { type: Date, default: Date.now },
            expiresAt: { type: Date }
        }
    ]
}, { timestamps: true });

// Indexes
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ branchId: 1, role: 1 });
userSchema.index({ 'refreshTokens.token': 1 });

// Hash password only if modified (prevents double hashing)
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.password);
};

// Remove password from responses
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.passwordResetToken;
    return obj;
};


const User = mongoose.model("User", userSchema);

export default User;
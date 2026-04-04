import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['EMAIL', 'SMS', 'IN_APP'],
        required: true
    },
    category: {
        type: String,
        enum: ['ORDER_UPDATE', 'LOW_STOCK', 'PAYMENT', 'WELCOME', 'ALERT'],
        required: true
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    recipient: String, // email or phone number
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED'],
        default: 'PENDING'
    },
    sentAt: Date,
    readAt: Date,
    isRead: { type: Boolean, default: false },
    relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    error: String
}, { timestamps: true });

notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ category: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

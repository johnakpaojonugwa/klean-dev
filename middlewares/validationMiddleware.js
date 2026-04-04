import { isValidEmail, isStrongPassword } from '../utils/validators.js';

export const validateRegister = (req, res, next) => {
    const { fullname, email, phoneNumber, password, confirmPassword } = req.body || {};

    const errors = [];

    if (!fullname || fullname.trim().length < 3) {
        errors.push("Full name must be at least 3 characters");
    }
    if (!email || !isValidEmail(email)) {
        errors.push("Valid email is required");
    }
    if (!phoneNumber || phoneNumber.trim().length < 10) {
        errors.push("Valid phone number is required");
    }
    if (!password || !isStrongPassword(password)) {
        errors.push("Password must be at least 8 characters with uppercase, number, and special character");
    }
    if (password !== confirmPassword) {
        errors.push("Password and confirm password do not match");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body || {};

    const errors = [];

    if (!email || !isValidEmail(email)) {
        errors.push("Valid email is required");
    }
    if (!password || password.length === 0) {
        errors.push("Password is required");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    next();
};

export const validateCreateOrder = (req, res, next) => {
    const { 
        branchId, 
        customerId, 
        customerName, 
        customerPhone, 
        items, 
        priority, 
        status 
    } = req.body || {};
    
    const errors = [];

    // Basic Identity & Contact Validation
    if (!branchId) errors.push("Branch ID is required");
    
    // Validate either an existing customer ID OR new customer details
    if (!customerId && (!customerName || !customerPhone)) {
        errors.push("Customer details (ID or Name & Phone) are required");
    }

    // Items Array Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push("At least one item is required in the order");
    } else {
        items.forEach((item, i) => {
            const index = i + 1;
            // Matches schema key: itemType
            if (!item.itemType) errors.push(`Item ${index}: Item type (e.g., Shirt) is required`);
            
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`Item ${index}: Quantity must be at least 1`);
            }
            
            // Matches schema key: unitPrice
            if (item.unitPrice === undefined || item.unitPrice < 0) {
                errors.push(`Item ${index}: Unit price is required and cannot be negative`);
            }
        });
    }

    // Enum Validation (Optional but recommended for production)
    const validPriorities = ['NORMAL', 'EXPRESS', 'URGENT'];
    if (priority && !validPriorities.includes(priority)) {
        errors.push(`Priority must be one of: ${validPriorities.join(", ")}`);
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
        errors.push("Invalid order status provided");
    }

    // Final Error Check
    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Validation failed", 
            errors 
        });
    }

    next();
};

export const validateComment = (req, res, next) => {
    const { text } = req.body || {};

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    next();
};

export const validateUpdateUser = (req, res, next) => {
    const { email, fullname, role } = req.body || {};
    const errors = [];

    if (email && !isValidEmail(email.trim())) errors.push("Valid email is required");
    if (fullname && fullname.trim().length < 3) errors.push("Full name must be at least 3 characters");
    if (role && !['SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'CUSTOMER'].includes(role)) errors.push("Invalid role");

    if (errors.length > 0) return res.status(400).json({ success: false, message: "Validation failed", errors });

    next();
};

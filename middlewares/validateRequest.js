// Reusable validation middleware with detailed error messages
export const validateOrderCreation = (req, res, next) => {
    const { customerId, branchId, items, dueDate } = req.body || {};
    const errors = [];

    // Validate customer
    if (!customerId || !customerId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("Valid customer ID (MongoDB ObjectId) is required");
    }

    // Validate branch
    if (!branchId || !branchId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("Valid branch ID (MongoDB ObjectId) is required");
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
        errors.push("At least one item is required");
    } else {
        items.forEach((item, index) => {
            if (!item.serviceName || item.serviceName.toString().trim().length === 0) {
                errors.push(`Item ${index + 1}: Service name is required`);
            }
            if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                errors.push(`Item ${index + 1}: Quantity must be a positive integer`);
            }
            if (item.unitPrice === undefined || item.unitPrice < 0 || typeof item.unitPrice !== 'number') {
                errors.push(`Item ${index + 1}: Unit price must be a non-negative number`);
            }
        });
    }

    // Validate due date
    if (dueDate) {
        const dueDateTime = new Date(dueDate).getTime();
        const now = new Date().getTime();
        if (isNaN(dueDateTime)) {
            errors.push("Due date must be a valid date");
        } else if (dueDateTime < now) {
            errors.push("Due date cannot be in the past");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

export const validateInventoryItem = (req, res, next) => {
    const { branchId, itemName, category, currentStock, unit, reorderLevel, supplierContact } = req.body || {};
    const errors = [];

    if (!branchId || !branchId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("Valid branch ID is required");
    }

    if (!itemName || itemName.toString().trim().length === 0) {
        errors.push("Item name is required");
    }

    if (!category || category.toString().trim().length === 0) {
        errors.push("Category is required");
    }

    if (currentStock === undefined || currentStock < 0 || !Number.isInteger(currentStock)) {
        errors.push("Current stock must be a non-negative integer");
    }

    if (!unit || unit.toString().trim().length === 0) {
        errors.push("Unit is required (e.g., kg, liters, pieces)");
    }

    if (reorderLevel === undefined || reorderLevel < 0 || !Number.isInteger(reorderLevel)) {
        errors.push("Reorder level must be a non-negative integer");
    }

    if (currentStock < reorderLevel) {
        errors.push("Warning: Current stock is below reorder level");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

export const validateStockAdjustment = (req, res, next) => {
    const { amount, changeType, reason } = req.body || {};
    const errors = [];

    if (amount === undefined || typeof amount !== 'number') {
        errors.push("Amount must be a number");
    }

    if (typeof amount === 'number' && (Number.isNaN(amount) || !Number.isInteger(amount))) {
        errors.push("Amount must be an integer");
    }

    if (typeof amount === 'number' && amount === 0) {
        errors.push("Amount cannot be zero");
    }

    if (!changeType || !['RESTOCK', 'USAGE', 'ADJUSTMENT', 'DAMAGE', 'LOST'].includes(changeType)) {
        errors.push("Change type must be one of: RESTOCK, USAGE, ADJUSTMENT, DAMAGE, LOST");
    }

    if (!reason || reason.toString().trim().length === 0) {
        errors.push("Reason for adjustment is required");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

export const validatePayrollCreation = (req, res, next) => {
    const { employeeId, payrollMonth, baseSalary, grossSalary, deductions } = req.body || {};
    const errors = [];

    if (!employeeId || !employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("Valid employee ID is required");
    }

    if (!payrollMonth || isNaN(new Date(payrollMonth).getTime())) {
        errors.push("Valid payroll month is required (YYYY-MM-DD format)");
    }

    if (baseSalary === undefined || baseSalary < 0 || typeof baseSalary !== 'number') {
        errors.push("Base salary must be a non-negative number");
    }

    if (grossSalary === undefined || grossSalary < 0 || typeof grossSalary !== 'number') {
        errors.push("Gross salary must be a non-negative number");
    }

    if (deductions === undefined || deductions < 0 || typeof deductions !== 'number') {
        errors.push("Deductions must be a non-negative number");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

export const validateBranchCreation = (req, res, next) => {
    const { name, address, email, contactNumber, servicesOffered } = req.body || {};
    const errors = [];

    if (!name || name.toString().trim().length < 2) {
        errors.push("Branch name must be at least 2 characters");
    }

    if (!address || !address.street || !address.city || !address.state) {
        errors.push("Complete address (street, city, state) is required");
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push("Valid email is required");
    }

    if (!contactNumber || !contactNumber.match(/^\+?[0-9]{7,15}$/)) {
        errors.push("Valid phone number (7-15 digits) is required");
    }

    if (!Array.isArray(servicesOffered) || servicesOffered.length === 0) {
        errors.push("At least one service must be offered");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

export const validateBranchUpdate = (req, res, next) => {
    const { name, address, email, contactNumber, servicesOffered } = req.body || {};
    const errors = [];

    // Only validate NAME if it's being updated
    if (name !== undefined && name.toString().trim().length < 2) {
        errors.push("Branch name must be at least 2 characters");
    }

    // Only validate ADDRESS if it's being updated
    if (address !== undefined) {
        if (typeof address !== 'object' || !address.street || !address.city || !address.state) {
            errors.push("To update address, provide complete street, city, and state");
        }
    }

    // Only validate EMAIL if it's being updated
    if (email !== undefined && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push("Valid email is required");
    }

    // Only validate PHONE if it's being updated
    if (contactNumber !== undefined && !contactNumber.match(/^\+?[0-9]{7,15}$/)) {
        errors.push("Valid phone number (7-15 digits) is required");
    }

    // Only validate SERVICES if they are being updated
    if (servicesOffered !== undefined) {
        if (!Array.isArray(servicesOffered) || servicesOffered.length === 0) {
            errors.push("At least one service must be offered");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Update validation failed",
            errors
        });
    }

    next();
};

export const validatePaginationParams = (req, res, next) => {
    const { page, limit } = req.query;

    if (page !== undefined) {
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer",
                errors: ["page must be >= 1"]
            });
        }
    }

    if (limit !== undefined) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 100",
                errors: ["limit must be 1-100"]
            });
        }
    }

    next();
};

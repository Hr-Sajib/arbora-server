import { z } from "zod";

// MongoDB ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Product schema for nested products array
const productSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid product Object Id format"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  discount: z.number().min(0, "Discount cannot be negative").optional().default(0),
});

// Create Order Validation Schema
const createOrderValidationSchema = z.object({
  date: z.string().datetime({ message: "Date must be in ISO 8601 format (e.g., 2025-07-17T00:00:00.000Z)" }),
  invoiceNumber: z.string().nonempty("Invoice number is required"),
  storeId: z.string().regex(objectIdRegex, "Invalid storeId format"),
  paymentDueDate: z.string().datetime({ message: "Due Date must be in ISO 8601 format (e.g., 2025-07-17T00:00:00.000Z)" }),
  orderAmount: z.number().min(0, "Order amount cannot be negative"),
  orderStatus: z
    .enum(["verified", "completed", "cancelled"])
    .optional()
    .default("verified"),
  paymentAmountReceived: z
    .number()
    .min(0, "Payment amount received cannot be negative")
    .optional()
    .default(0),
  paymentStatus: z
    .enum(["paid", "notPaid", "partiallyPaid"])
    .optional()
    .default("notPaid"),
  products: z
    .array(productSchema)
    .nonempty("At least one product is required"),
});

// Update Order Validation Schema
const updateOrderValidationSchema = z.object({
    date: z.string().datetime({ message: "Date must be in ISO 8601 format (e.g., 2025-07-17T00:00:00.000Z)" }).optional(),
  invoiceNumber: z.string().nonempty("Invoice number cannot be empty").optional(),
  PONumber: z.string().nonempty("PO number cannot be empty").optional(),
  storeId: z
    .string()
    .regex(objectIdRegex, "Invalid storeId format")
    .optional(),
  paymentDueDate: z
    .string()
    .nonempty("Payment due date cannot be empty")
    .optional(),
  orderAmount: z
    .number()
    .min(0, "Order amount cannot be negative")
    .optional(),
  orderStatus: z
    .enum(["verified", "completed", "cancelled"])
    .optional(),
  paymentAmountReceived: z
    .number()
    .min(0, "Payment amount received cannot be negative")
    .optional(),
  paymentStatus: z
    .enum(["paid", "notPaid", "partiallyPaid"])
    .optional(),
  products: z.array(productSchema).optional(),
});

export const orderValidation = {
  createOrderValidationSchema,
  updateOrderValidationSchema,
};
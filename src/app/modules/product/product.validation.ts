import { z } from "zod";
import { DimensionUnit, PackingUnit, WeightUnit } from "./product.interface";

// Optional nested object schema for packageDimensions
const packageDimensionsSchema = z
  .object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: z.nativeEnum(DimensionUnit),
  })
  .optional();

// Zod schema for creating a Product
const createProductValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Product name is required"),
    packetSize: z.string(),
    weight: z.number().min(0, "Weight must be non-negative"),
    weightUnit: z.nativeEnum(WeightUnit),

    categoryId: z.string().min(1, "Category ID is required"),

    reorderPointOfQuantity: z
      .number()
      .min(0, "Reorder point must be non-negative"),

    salesPrice: z.number().min(0, "Sales price must be non-negative"),
    purchasePrice: z.number().min(0, "Purchase price must be non-negative"),

    barcodeString: z.string().trim().min(1, "Barcode is required"),

    quantity: z.number().min(0, "Quantity must be non-negative"),

    warehouseLocation: z
      .string()
      .trim()
      .min(1, "Warehouse location is required"),

    packageDimensions: packageDimensionsSchema,
  }),
});

const updateProductValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),

    packetQuantity: z.number().min(1).optional(),
    packingUnit: z.nativeEnum(PackingUnit).optional(),

    weight: z.number().min(0).optional(),
    weightUnit: z.nativeEnum(WeightUnit).optional(),

    categoryId: z.string().optional(),

    reorderPointOfQuantity: z.number().min(0).optional(),

    salesPrice: z.number().min(0).optional(),
    purchasePrice: z.number().min(0).optional(),

    barcodeString: z.string().trim().optional(),
    itemNumber: z.string().trim().optional(),

    quantity: z.number().min(0).optional(),

    warehouseLocation: z.string().trim().optional(),

    packageDimensions: packageDimensionsSchema,
  }),
});

export const productValidation = {
  createProductValidationSchema,
  updateProductValidationSchema,
};

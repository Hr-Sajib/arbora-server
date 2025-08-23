import { Schema, model } from "mongoose";
import {
  DimensionUnit,
  IProduct,
  WeightUnit,
} from "./product.interface";

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    isDeleted:{
      type: Boolean,
      default: false
    },
    competitorPrice:{
      type: Number,
    },
    packetSize: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },

    weightUnit: {
      type: String,
      enum: Object.values(WeightUnit),
      required: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    incomingQuantity: {
      type: Number,
      default: 0,
    },

    reorderPointOfQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    salesPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    barcodeString: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    itemNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    warehouseLocation: {
      type: String,
      trim: true,
    },

    packageDimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: Object.values(DimensionUnit),
      },
    },
  },
  {
    timestamps: true,
  }
);

export const ProductModel = model<IProduct>("Product", ProductSchema);

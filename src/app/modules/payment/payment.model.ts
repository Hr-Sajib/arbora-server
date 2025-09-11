// src/app/modules/payment/payment.model.ts

import { Schema, model } from "mongoose";
import { IPayment } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store", // Adjust ref based on your store model
      required: true,
    },
    forOrderId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order", // Adjust ref based on your order model
        required: true,
      },
    ],
    method: {
      type: String,
      enum: ["check", "cash", "cc", "donation"],
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    checkNumber: {
      type: String, // Optional field
    },
    checkImage: {
      type: String, // Optional field
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
// src/app/modules/payment/payment.model.ts

import { Schema, model, Types } from "mongoose";
import { IPayment } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    forOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    method: {
      type: String,
      enum: ["check", "cash", "cc", "donation"],
      required: true,
    },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    checkNumber: { type: String},
    checkImage: { type: String},
    idDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const PaymentModel = model<IPayment>("Payment", paymentSchema);

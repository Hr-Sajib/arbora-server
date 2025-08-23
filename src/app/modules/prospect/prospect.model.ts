// src/app/modules/prospect/prospect.model.ts

import { Schema, model } from "mongoose";
import { IProspect } from "./prospect.interface";

export const phoneRegex = /^\(\d{3}\)\d{3}-\d{4}$/;

const prospectSchema = new Schema<IProspect>(
  {
    storeName: { type: String, required: true },
    // storePhone: { type: String },
    storePhone: {
      type: String,
      required: [true, "Store phone is required"],
    },
    storePersonEmail: { type: String },
    storePersonName: {
      type: String,
      required: [true, "Customer full name is required"],
    },
    storePersonPhone: {
      type: String,
      required: [true, "Store person phone is required"],
      validate: {
        validator: function (v: string) {
          return phoneRegex.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid phone number! Expected format: (123)456-7890`,
      },
    },
    salesTaxId: { type: String },

    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
    },
    shippingState: {
      type: String,
      required: [true, "Shipping City is required"],
    },
    shippingZipcode: { type: String },
    shippingCity: {
      type: String,
      required: [true, "Shipping City is required"],
    },

    miscellaneousDocImage: { type: String },

    leadSource: { type: String },
    note: { type: String },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "rejected", "converted"],
      required: true,
      default: "new",
    },
    assignedSalesPerson: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    followUpActivities: [
      {
        activity: { type: String },
        activityDate: { type: String },
        activityMedium: {
          type: String,
          enum: ["call", "email", "meeting", "whatsapp"],
        },
      },
    ],
    quotedList: [
      {
        productObjId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        itemNumber: { type: String, required: true },
        itemName: { type: String, required: true },
        packetSize: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    competitorStatement: { type: String },

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ProspectModel = model<IProspect>("Prospect", prospectSchema);

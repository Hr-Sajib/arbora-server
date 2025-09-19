import { Schema, model } from "mongoose";
import { ICustomer } from "./customer.interface";


const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;

const customerSchema = new Schema<ICustomer>(
  {
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      minlength: [1, "Store name cannot be empty"],
    },
    storePhone: {
      type: String,
      required: [true, "Store phone is required"],
      // match: [phoneRegex, "Invalid store phone format (e.g., +1234567890, (123) 456-7890, 123-456-7890)"],
    },
    storePersonEmail: {
      type: String,
      required: [true, "Store person email is required"],
      // match: [emailRegex, "Invalid email format (e.g., user@example.com)"],
      lowercase: true,
      trim: true,
    },
    salesTaxId: {
      type: String,
      trim: true,
      default: "not provided"
    },
    acceptedDeliveryDays: {
      type: [String],
      enum: {
        values: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"],
        message: "{VALUE} is not a valid delivery day",
      },
    },
    isCustomerSourceProspect: {
      type: Boolean,
      default: false,
    },
    bankACHAccountInfo: {
      type: String,
      trim: true,
      default: "not provided"
    },
    storePersonName: {
      type: String,
      trim: true,
      minlength: [1, "Store person name cannot be empty"],
    },
    storePersonPhone: {
      type: String,
      // match: [phoneRegex, "Invalid store person phone format (e.g., +1234567890, (123) 456-7890, 123-456-7890)"],
    },
    billingAddress: {
      type: String,
      trim: true,
      minlength: [1, "Billing address cannot be empty"],
    },
    billingState: {
      type: String,
      trim: true,
      minlength: [1, "Billing state cannot be empty"],
    },
    billingZipcode: {
      type: String,
      // match: [zipcodeRegex, "Invalid billing zipcode format (e.g., 12345 or 12345-6789)"],
    },
    billingCity: {
      type: String,
      trim: true,
      minlength: [1, "Billing city cannot be empty"],
    },
    shippingAddress: {
      type: String,
      trim: true,
      minlength: [1, "Shipping address cannot be empty"],
    },
    shippingState: {
      type: String,
      trim: true,
      minlength: [1, "Shipping state cannot be empty"],
    },
    shippingZipcode: {
      type: String,
      // match: [zipcodeRegex, "Invalid shipping zipcode format (e.g., 12345 or 12345-6789)"],
    },
    shippingCity: {
      type: String,
      trim: true,
      minlength: [1, "Shipping city cannot be empty"],
    },
    creditApplication: {
      type: String,
      trim: true,
    },
    ownerLegalFrontImage: {
      type: String,
    },
    ownerLegalBackImage: {
      type: String,
    },
    voidedCheckImage: {
      type: String,
    },
    miscellaneousDocImage: {
      type: String,
      optional: true,
    },
    note:{
      type: String,
      optional: true,
    },

    creditBalance: {
      type: Number,
      default: 0
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const CustomerModel = model<ICustomer>("Customer", customerSchema);
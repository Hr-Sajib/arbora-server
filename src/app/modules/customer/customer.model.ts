import { Schema, model, Types } from "mongoose";
import { ICustomer } from "./customer.interface";

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
    },
    storePersonEmail: {
      type: String,
      required: [true, "Store person email is required"],
      lowercase: true,
      trim: true,
    },
    salesTaxId: {
      type: String,
      trim: true,
      default: "not provided",
    },
    acceptedDeliveryDays: {
      type: [String],
      enum: {
        values: [
          "saturday",
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
        ],
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
      default: "not provided",
    },
    storePersonName: {
      type: String,
      trim: true,
      minlength: [1, "Store person name cannot be empty"],
    },
    storePersonPhone: {
      type: String,
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
    },
    note: {
      type: String,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    quotedList: [
      {
        itemNumber: {
          type: String,
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        packetSize: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const CustomerModel = model<ICustomer>("Customer", customerSchema);

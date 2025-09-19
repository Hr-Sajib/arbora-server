import { Schema, model } from "mongoose";
import { IOrder } from "./order.interface";

const orderSchema = new Schema<IOrder>(
  {
    date: { type: String, required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    PONumber: { type: String, required: true },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    paymentDueDate: { type: String, required: true },
    totalPayable: { type: Number, required: true },
    shippingDate: { type: String},
    orderAmount: { type: Number, required: true },
    shippingCharge:  { type: Number, default: 0 },
    orderStatus: {
      type: String,
      enum: ["verified", "completed", "cancelled"],
      default: "verified",
    },


    creditInfo: {
      amount: { type: Number, default: 0 },
      date: { type: String, default: null },
    },


    isEmailSentBefore5daysOfDue: { type: Boolean, default: false },
    isReminderPaused: { type: Boolean, default: false },
    reminderNumber: { type: Number, default: 0 },
    

    
    isDeleted: { type: Boolean, default: false },
    paymentAmountReceived: { type: Number, default: 0 },
    discountGiven: { type: Number, default: 0 },
    openBalance: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    profitPercentage: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "notPaid", "partiallyPaid", "overPaid"],
      default: "notPaid",
    },
    deliveryDoc: {type: String, default: null },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        price: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Calculate
orderSchema.pre("save", function (next) {
  // Calculate total discount from products array
  this.discountGiven = this.products.reduce(
    (total: number, product: { discount: number }) => {
      return total + (product.discount || 0);
    },
    0
  );
  next();
});

export const OrderModel = model<IOrder>("Order", orderSchema);

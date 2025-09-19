import { Types } from "mongoose";

export interface IOrder {
  _id: string;
  date: string;
  invoiceNumber: string;
  PONumber: string;
  storeId: Types.ObjectId;
  paymentDueDate: string;

  orderAmount: number; //total amount
  shippingCharge: number;
  discountGiven: number; //total discounts given in products section of order
  openBalance: number; //remained amount
  profitAmount: number; //vs base products' price total
  profitPercentage: number;
  paymentAmountReceived: number;

  shippingDate?: string;
  totalPayable: number;

  orderStatus: "verified" | "completed" | "cancelled";
  paymentStatus: "paid" | "notPaid" | "partiallyPaid" | "overPaid";
  deliveryDoc: string,
  products: {
    productId: Types.ObjectId;
    quantity: number;
    price: number;
    discount: number;
  }[];

  creditInfo: {
    amount: number,
    date: string
  }


  // reminders
  isEmailSentBefore5daysOfDue: boolean;
  isReminderPaused: boolean;
  reminderNumber: number;

  isDeleted: boolean;
}

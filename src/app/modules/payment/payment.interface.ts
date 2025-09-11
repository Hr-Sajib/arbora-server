import { Types } from "mongoose";

export interface IPayment {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  forOrderId: Types.ObjectId[]; // Array to support multiple orders
  method: "check" | "cash" | "cc" | "donation";
  date: string;
  amount: number;
  checkNumber?: string; // Made optional since not all methods require it
  checkImage?: string; // Made optional since not all methods require it
  isDeleted: boolean; // Corrected typo from idDeleted to isDeleted
}
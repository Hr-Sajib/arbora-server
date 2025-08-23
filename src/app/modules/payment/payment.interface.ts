import { Types } from "mongoose";

export interface IPayment {
    _id: Types.ObjectId,
    storeId: Types.ObjectId,
    forOrderId: Types.ObjectId
    method: "check" | "cash" | "cc" | "donation",
    date: string,
    amount: number,
    checkNumber: string,
    checkImage: string,
    idDeleted: boolean
 }
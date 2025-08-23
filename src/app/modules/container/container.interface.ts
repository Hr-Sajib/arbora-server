import { Types } from "mongoose";

export interface IContainer {
  _id?: Types.ObjectId;
  containerNumber?: string;
  containerName: string;
  containerStatus: "arrived" | "onTheWay";
  deliveryDate: string;
  containerProducts: {
    category: string;
    itemNumber: string;
    packetSize: string;
    quantity: number;
    purchasePrice: number;
    salesPrice: number;
    perCaseCost: number;
    perCaseShippingCost: number;
  }[];
  shippingCost?: number;
  isDeleted: boolean;
}

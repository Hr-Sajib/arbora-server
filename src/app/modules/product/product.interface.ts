import { Types } from "mongoose";

export enum WeightUnit {
  KILOGRAM = "KILOGRAM",
  POUND = "POUND",
  OUNCE = "OUNCE",
  LITRE = "LITRE",
  PIECE = "PIECE",
  GRAM = "GRAM",
  MILLIGRAM = "MILLIGRAM",
  MILLILITRE = "MILLILITRE",
}

export enum PackingUnit {
  BOX = "BOX",
  PACKET = "PACKET",
  CARTON = "CARTON",
  BAG = "BAG",
  BOTTLE = "BOTTLE",
}

export enum DimensionUnit {
  CM = "CM",
  INCH = "INCH",
}

export interface IProduct {
  _id: string,
  name: string;
  // packetQuantity: number;
  isDeleted: boolean;
  packetSize : string;
  // packingUnit: PackingUnit;
  weight: number;
  weightUnit: WeightUnit;
  categoryId: Types.ObjectId | { _id: Types.ObjectId; name: string };
  salesPrice: number;
  purchasePrice: number;
  barcodeString: string;
  itemNumber: string;
  quantity: number;
  warehouseLocation: string;
  reorderPointOfQuantity: number;
  packageDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: DimensionUnit;
  };
  incomingQuantity: number;
  createdAt?: Date;
  updatedAt?: Date;
  competitorPrice?: number;
}
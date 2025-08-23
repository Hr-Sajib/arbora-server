import { Types } from "mongoose";

export interface IProspect {
    _id: string;

    // Basic identifiers
    storeName: string;
    storePhone?: string;
    storePersonEmail?: string;
    storePersonName?: string;
    storePersonPhone?: string;
    salesTaxId?: string;
    
    // Addresses
    shippingAddress?: string;
    shippingState?: string,
    shippingZipcode?: string,
    shippingCity?: string,

    // Documents
    miscellaneousDocImage?: string;

    // Prospect-specific fields
    leadSource?: string; 
    note?: string;
    status: "new" | "contacted" | "qualified" | "rejected" | "converted";
    assignedSalesPerson?: Types.ObjectId;
    followUpActivities?: {
        activity: string,
        activityDate: string,
        activityMedium: "call" | "email" | "meeting" | "whatsapp" 
    }[];
    quotedList : {
        productObjId: Types.ObjectId,
        itemNumber: string,
        itemName: string,
        packetSize: string,
        price: number,
    }[]

    competitorStatement: string

    isDeleted: boolean;


    createdAt?: Date;
    updatedAt?: Date;
}

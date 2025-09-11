import { Types } from "mongoose";

export interface ICustomer {
    _id?: string,
    storeName: string,
    storePhone: string,
    storePersonEmail: string,
    salesTaxId: string,
    acceptedDeliveryDays?: ("saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday")[];
    bankACHAccountInfo: string,
    storePersonName: string,
    storePersonPhone: string,
    billingAddress: string,
    billingState: string,
    billingZipcode: string,
    billingCity: string,
    isCustomerSourceProspect: boolean,
    shippingAddress: string,
    shippingState: string,
    shippingZipcode: string,
    shippingCity: string,
    creditApplication: string,
    ownerLegalFrontImage: string,
    ownerLegalBackImage: string,
    voidedCheckImage: string,
    isDeleted: boolean,
    miscellaneousDocImage?: string,
    note?: string
     
}
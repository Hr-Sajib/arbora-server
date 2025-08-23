/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { IProspect } from "./prospect.interface";
import { ProspectModel } from "./prospect.model";
import { CustomerModel } from "../customer/customer.model";
import { UserModel } from "../user/user.model";
import { ProductModel } from "../product/product.model";
import { sendMail } from "../../utils/sendMail";
import * as fs from "node:fs/promises";


const createProspectIntoDB = async (payload: IProspect) => {
  const prospectData = {
    ...payload,
    isDeleted: false,
  };

 
  const createdProspect = await ProspectModel.create(prospectData);
  return createdProspect;
};


const getAllProspectsFromDB = async (salesUserEmail: string) => {

  const salesPerson = await UserModel.findOne({ email: salesUserEmail });
  if (!salesPerson) {
    throw new AppError(httpStatus.BAD_REQUEST, "Sales person does not exist anymore!");
  }


  let result;

    result = await ProspectModel.find({ assignedSalesPerson: salesPerson._id, isDeleted: false })
      .populate("assignedSalesPerson")
      .populate("quotedList.productObjId");
    console.log("Service - Sales user case - Number of prospects:", result.length);


  console.log("Service - Final result length:", result.length); // Debug: Log final length
  return result;
};
          
const getSingleProspectFromDB = async (id: string) => {
  const result = await ProspectModel.findOne({ _id: id, isDeleted: false })
    .populate("assignedSalesPerson")
    .populate("quotedList.productObjId")
    .lean();
  return result;
};

const updateProspectIntoDB = async (id: string, payload: Partial<IProspect>) => {

    // Check existence
    const existingProspect = await ProspectModel.findOne({ _id: id, isDeleted: false });
    if (!existingProspect) {
        throw new AppError(httpStatus.NOT_FOUND, "Prospect not found or already deleted");
    }

    // Validate assignedSalesPerson if provided
    if (payload.assignedSalesPerson) {
        const user = await UserModel.findById(payload.assignedSalesPerson);
        if (!user) {
            throw new AppError(httpStatus.BAD_REQUEST, "Assigned salesperson not found");
        }
    }

    // Validate each quoted product
    if (payload.quotedList && Array.isArray(payload.quotedList)) {
        for (const quote of payload.quotedList) {
            if (quote.productObjId) {
                const product = await ProductModel.findById(quote.productObjId);
                if (!product) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Product with ID ${quote.productObjId} not found in quoted list`
                    );
                }
            }
        }
    }

    // Update and populate
    const updatedProspect = await ProspectModel.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
    )
    .populate("assignedSalesPerson")
    .populate("quotedList.productObjId");

    if (!updatedProspect) {
        throw new AppError(httpStatus.NOT_FOUND, "Prospect not found or already deleted");
    }

    return updatedProspect;
};


const deleteProspectIntoDB = async (id: string) => {
  const result = await ProspectModel.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Prospect not found");
  }

  return result;
};

const makeCustomerFromProspect = async (id: string) => {
  // Fetch the prospect by ID
  const prospect = await ProspectModel.findOne({ _id: id, isDeleted: false }).lean();
  if (!prospect) {
    throw new AppError(httpStatus.NOT_FOUND, "Prospect not found or already deleted");
  }


  const customerData = {
    storeName: prospect.storeName,
    isCustomerSourceProspect: true,
    storePhone: prospect.storePhone || "N/A",
    storePersonEmail: prospect.storePersonEmail || "prospect@example.com",
    salesTaxId: prospect.salesTaxId || "N/A",
    acceptedDeliveryDays: ["monday"], // default to Monday
    bankACHAccountInfo: "N/A", // default value
    storePersonName: prospect.storePersonName || "N/A",
    storePersonPhone: prospect.storePersonPhone || "N/A",
    billingAddress: prospect.shippingAddress || "N/A",
    billingState: prospect.shippingState || "N/A",
    billingZipcode: prospect.shippingZipcode || "N/A",
    billingCity: prospect.shippingCity || "N/A",
    shippingAddress: prospect.shippingAddress || "N/A",
    shippingState: prospect.shippingState || "N/A",
    shippingZipcode: prospect.shippingZipcode || "N/A",
    shippingCity: prospect.shippingCity || "N/A",
    creditApplication: "N/A", // default value
    ownerLegalFrontImage: prospect.miscellaneousDocImage || "https://i.postimg.cc/fRyv1Djb/doc.png",
    ownerLegalBackImage: prospect.miscellaneousDocImage || "https://i.postimg.cc/fRyv1Djb/doc.png",
    voidedCheckImage: prospect.miscellaneousDocImage || "https://i.postimg.cc/fRyv1Djb/doc.png",
    miscellaneousDocImage: prospect.miscellaneousDocImage || undefined,
    isDeleted: false,
  };

  // Create the customer
  const createdCustomer = await CustomerModel.create(customerData);

  // Mark prospect as converted
  await ProspectModel.findByIdAndUpdate(
    id,
    { $set: { status: "converted" } },
    { new: true }
  );

  return createdCustomer;
};

const sendQuoteToProspect = async (prospectId: string) => {

    // Read the logo image from the public folder as base64
    const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
    const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
    const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png
  


  // Fetch the prospect by ID
  const prospect = await ProspectModel.findOne({ _id: prospectId, isDeleted: false })
    .populate("quotedList.productObjId")
    .lean();
  if (!prospect) {
    throw new AppError(httpStatus.NOT_FOUND, "Prospect not found or already deleted");
  }

  // Check if storePersonEmail is set
  if (!prospect.storePersonEmail) {
    throw new AppError(httpStatus.BAD_REQUEST, "storePersonEmail not set for this prospect");
  }

  // Prepare quote details
  const quoteDetails = prospect.quotedList
    .map(quote => `
      <li>
        Product: ${quote.itemName} (${quote.packetSize}) - Price: $${quote.price.toFixed(2)}
      </li>
    `)
    .join("");

  const totalQuoteAmount = prospect.quotedList.reduce((sum, quote) => sum + quote.price, 0).toFixed(2);

  // Email content
  const subject = "Your Quote from Arbora";
  const text = `Dear ${prospect.storePersonEmail.split("@")[0]},

Thank you for your interest in Arbora. Below are the details of your quoted products:

${prospect.quotedList.map(quote => `Product: ${quote.itemName} (${quote.packetSize}) - Price: $${quote.price.toFixed(2)}`).join("\n")}

Total Quote Amount: $${totalQuoteAmount}

Please review the quote and contact us at sales@arbora.com to proceed or for any questions.

Best regards,
Arbora Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
            <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
      </div>
      <h2 style="color: #4CAF50; text-align: center;">Our Offerings from Arbora 🎉</h2>
      <p style="font-size: 16px; color: #333;">
        Dear ${prospect.storePersonEmail.split("@")[0]},
      </p>
      <p style="font-size: 16px; color: #333;">
        Thank you for your interest in our products. Below are the details of your quoted items:
      </p>
      <ul style="font-size: 16px; color: #333; padding-left: 20px;">
        ${quoteDetails}
      </ul>
      <p style="font-size: 16px; color: #333; font-weight: bold;">
        Total Quote Amount: $${totalQuoteAmount}
      </p>
      <p style="font-size: 16px; color: #333;">
        Please review the quote and feel free to contact us at <a href="mailto:sales@arbora.com">sales@arbora.com</a> to proceed or for any questions.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
        We look forward to serving you!
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">
        - Arbora Team
      </p>
    </div>
  `;

  // Send the email
  await sendMail({ to: prospect.storePersonEmail, subject, text, html });

  return {
    success: true,
    message: "Quote email sent successfully",
  };
};
export const ProspectServices = {
  createProspectIntoDB,
  getAllProspectsFromDB,
  getSingleProspectFromDB,
  updateProspectIntoDB,
  deleteProspectIntoDB,
  makeCustomerFromProspect,
  sendQuoteToProspect
};
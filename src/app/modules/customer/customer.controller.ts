import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { CustomerServices } from "./customer.service";
import { CustomerModel } from "./customer.model";
import AppError from "../../errors/AppError";
import { exportCustomersToExcel, exportGroupedProductsToExcel } from "../../utils/exportToExcel";
import { ICustomer } from "./customer.interface";

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;

  const existing = await CustomerModel.findOne({ storeName: body.storeName });
  if (existing) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Customer store already exists with this name!"
    );
  }

  const result = await CustomerServices.createCustomerIntoDB(body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer created successfully",
    data: result,
  });
});

const getAllCustomers = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerServices.getAllCustomersFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customers fetched successfully",
    data: result,
  });
});

const getSingleCustomer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CustomerServices.getSingleCustomerFromDB(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer fetched successfully",
    data: result,
  });
});

const updateCustomer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const existingCustomer = await CustomerModel.findById(id);

  if (!existingCustomer || existingCustomer.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
  }

  const result = await CustomerServices.updateCustomerIntoDB(id, updatePayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer updated successfully",
    data: result,
  });
});

const deleteCustomer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CustomerServices.deleteCustomerIntoDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer deleted successfully",
    data: result,
  });
});







const sendSpecialEmailWithQuoteController = catchAsync(async (req: Request, res: Response) => {
  const { id: customerId } = req.params;
  const quoteList = req?.body?.quoteList;
  const noteText = req?.body?.noteText;

  const result = await CustomerServices.sendSpecialEmailWithQuote(customerId,quoteList,noteText);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Email sent successfully",
    data: result,
  });
});











const generatePallet = catchAsync(async (req: Request, res: Response) => {
  const { id: customerId } = req.params;

  const pdfBuffer = await CustomerServices.generatePallet(customerId);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=ship-to-address.pdf",
  });

  res.status(httpStatus.OK).send(pdfBuffer);
});



// Get customers xl


const generateXlforAllCustomers = catchAsync(
  async (req: Request, res: Response) => {
    console.log("Generating XL for all customers...");
    const result = await CustomerModel.find();
    console.log("Fetched customers count:", result.length);

    // ✅ Check if client wants Excel export
    const shouldDownload = req.query.download === "true";
    console.log("Should download Excel:", shouldDownload);

    if (shouldDownload) {
      console.log("Exporting Excel with data:", result.slice(0, 2)); // Log first 2 items for brevity
      return exportCustomersToExcel(result as ICustomer[], res);
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customers retrieved successfully",
      data: result,
    });
  }
);




export const CustomerControllers = {
  createCustomer,
  getAllCustomers,
  getSingleCustomer,
  updateCustomer,
  deleteCustomer,
  sendSpecialEmailWithQuoteController,
  generatePallet,
  generateXlforAllCustomers
};

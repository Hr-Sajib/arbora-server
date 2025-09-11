import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { PaymentServices } from "./payment.service";
import { PaymentModel } from "./payment.model";
import AppError from "../../errors/AppError";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;

  const result = await PaymentServices.createPaymentIntoDB(body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment created successfully",
    data: result,
  });
});

const getCustomersPayments = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.customerId;
  console.log("id: ",id)
  const result = await PaymentServices.getCustomersAllPaymentsFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customers payments fetched successfully",
    data: result,
  });
});
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.getAllPaymentsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments fetched successfully",
    data: result,
  });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PaymentServices.getSinglePaymentFromDB(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment fetched successfully",
    data: result,
  });
});

const updatePayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const existingPayment = await PaymentModel.findById(id);

  // if (!existingPayment || existingPayment.idDeleted) {
  //   throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  // }

  const result = await PaymentServices.updatePaymentIntoDB(id, updatePayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment updated successfully",
    data: result,
  });
});

const deletePayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PaymentServices.deletePaymentIntoDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment deleted successfully",
    data: result,
  });
});

export const PaymentControllers = {
  createPayment,
  getAllPayments,
  getSinglePayment,
  updatePayment,
  deletePayment,
  getCustomersPayments
};
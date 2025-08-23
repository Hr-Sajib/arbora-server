/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { IPayment } from "./payment.interface";
import { PaymentModel } from "./payment.model";
import { CustomerModel } from "../customer/customer.model";
import { OrderModel } from "../order/order.model";
import mongoose, { Types } from "mongoose";

const createPaymentIntoDB = async (payLoad: IPayment) => {

  const { forOrderId, checkNumber, method, checkImage, amount } =
    payLoad;

  // Validate amount is positive
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be positive!");
  }

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();

  try {
    // Begin transaction
    session.startTransaction();

    // Verify forOrderId exists and fetch order details
    const existingOrder = await OrderModel.findOne({
      _id: forOrderId,
      isDeleted: false,
    }).session(session);
    if (!existingOrder) {
      throw new AppError(httpStatus.BAD_REQUEST, "Order not found!");
    }

    // Validate check payment requirements
    if (method === "check" && (!checkNumber || !checkImage)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Both check number and image must be provided for check payment!"
      );
    }

    // Calculate total order amount and total paid amount
    const totalOrderAmount = existingOrder.totalPayable;
    const totalPaidAmount: number = Number(existingOrder.paymentAmountReceived) + Number(amount);


    // Determine paymentStatus
    let paymentStatus: string;
    if (totalPaidAmount < totalOrderAmount) {
      paymentStatus = "partiallyPaid";
    } else if (totalPaidAmount === totalOrderAmount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "overPaid";
    }


    // Prepare payment data
    const paymentData = {
      storeId: payLoad.storeId,
      forOrderId: payLoad.forOrderId,
      method: payLoad.method,
      date: payLoad.date,
      amount: payLoad.amount,
      checkNumber: payLoad.checkNumber,
      checkImage: payLoad.checkImage,
    };

    // Create payment within transaction
    const createdPayment = await PaymentModel.create([paymentData], {
      session,
    });

    // Update order's paymentAmountReceived and paymentStatus
    const updatedOrder = await OrderModel.updateOne(
      { _id: forOrderId, isDeleted: false },
      {
        $inc: {
          paymentAmountReceived: amount,
          openBalance: -amount,
        },
        $set: { paymentStatus },
      },
      { session }
    );

    if (updatedOrder.matchedCount === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Order not found or already deleted!"
      );
    }

    // Commit transaction
    await session.commitTransaction();
    return createdPayment[0];
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error instanceof AppError
      ? error
      : new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to create payment"
        );
  } finally {
    // End session
    session.endSession();
  }
};

const getAllPaymentsFromDB = async () => {
  const result = await PaymentModel.find({ idDeleted: false })
    .populate("storeId")
    .populate("forOrderId");
  return result;
};

const getCustomersAllPaymentsFromDB = async (id: string) => {
  // console.log("____")
  const result = await PaymentModel.find({ idDeleted: false })
    .populate("storeId")
    .populate("forOrderId");
  const objectId = new mongoose.Types.ObjectId(id);
  const hisPayments = result.filter((p) => p.storeId.equals(objectId));

  return hisPayments;
};

const getSinglePaymentFromDB = async (id: string) => {
  const result = await PaymentModel.findOne({ _id: id, idDeleted: false })
    .populate("storeId")
    .populate("forOrderId");
  return result;
};

const updatePaymentIntoDB = async (id: string, payload: Partial<IPayment>) => {
  const updateData = {
    storeId: payload.storeId,
    forOrderId: payload.forOrderId,
    method: payload.method,
    date: payload.date,
    amount: payload.amount,
    checkNumber: payload.checkNumber,
    checkImage: payload.checkImage,
  };

  // If updating storeId or forOrderId, verify they exist
  if (payload.storeId) {
    const existingCustomer = await CustomerModel.findOne({
      _id: payload.storeId,
      isDeleted: false,
    });
    if (!existingCustomer) {
      throw new AppError(httpStatus.BAD_REQUEST, "Customer not found!");
    }
  }

  if (payload.forOrderId) {
    const existingOrder = await OrderModel.findOne({
      _id: payload.forOrderId,
      isDeleted: false,
    });
    if (!existingOrder) {
      throw new AppError(httpStatus.BAD_REQUEST, "Order not found!");
    }
  }

  const updatedPayment = await PaymentModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .where({ idDeleted: false })
    .populate("storeId")
    .populate("forOrderId");

  if (!updatedPayment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment not found or already deleted"
    );
  }

  return updatedPayment;
};

const deletePaymentIntoDB = async (id: string) => {
  const result = await PaymentModel.findByIdAndUpdate(
    id,
    { $set: { idDeleted: true } },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  return result;
};

export const PaymentServices = {
  createPaymentIntoDB,
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  updatePaymentIntoDB,
  deletePaymentIntoDB,
  getCustomersAllPaymentsFromDB,
};

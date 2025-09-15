/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { IPayment } from "./payment.interface";
import { PaymentModel } from "./payment.model";
import { CustomerModel } from "../customer/customer.model";
import { OrderModel } from "../order/order.model";
import mongoose, { Types } from "mongoose";

// const createPaymentIntoDB = async (payLoad: IPayment) => {

//   const { forOrderId, checkNumber, method, checkImage, amount } =
//     payLoad;

//   // Validate amount is positive
//   if (amount <= 0) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Amount must be positive!");
//   }

//   // Start a MongoDB session for transaction
//   const session = await mongoose.startSession();

//   try {
//     // Begin transaction
//     session.startTransaction();

//     // Verify forOrderId exists and fetch order details
//     const existingOrder = await OrderModel.findOne({
//       _id: forOrderId,
//       isDeleted: false,
//     }).session(session);
//     if (!existingOrder) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Order not found!");
//     }

//     // Validate check payment requirements
//     if (method === "check" && (!checkNumber || !checkImage)) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "Both check number and image must be provided for check payment!"
//       );
//     }

//     // Calculate total order amount and total paid amount
//     const totalOrderAmount = existingOrder.totalPayable;
//     const totalPaidAmount: number = Number(existingOrder.paymentAmountReceived) + Number(amount);


//     // Determine paymentStatus
//     let paymentStatus: string;
//     if (totalPaidAmount < totalOrderAmount) {
//       paymentStatus = "partiallyPaid";
//     } else if (totalPaidAmount === totalOrderAmount) {
//       paymentStatus = "paid";
//     } else {
//       paymentStatus = "overPaid";
//     }


//     // Prepare payment data
//     const paymentData = {
//       storeId: payLoad.storeId,
//       forOrderId: payLoad.forOrderId,
//       method: payLoad.method,
//       date: payLoad.date,
//       amount: payLoad.amount,
//       checkNumber: payLoad.checkNumber,
//       checkImage: payLoad.checkImage,
//     };

//     // Create payment within transaction
//     const createdPayment = await PaymentModel.create([paymentData], {
//       session,
//     });

//     // Update order's paymentAmountReceived and paymentStatus
//     const updatedOrder = await OrderModel.updateOne(
//       { _id: forOrderId, isDeleted: false },
//       {
//         $inc: {
//           paymentAmountReceived: amount,
//           openBalance: -amount,
//         },
//         $set: { paymentStatus },
//       },
//       { session }
//     );

//     if (updatedOrder.matchedCount === 0) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "Order not found or already deleted!"
//       );
//     }

//     // Commit transaction
//     await session.commitTransaction();
//     return createdPayment[0];
//   } catch (error) {
//     // Rollback transaction on error
//     await session.abortTransaction();
//     throw error instanceof AppError
//       ? error
//       : new AppError(
//           httpStatus.INTERNAL_SERVER_ERROR,
//           "Failed to create payment"
//         );
//   } finally {
//     // End session
//     session.endSession();
//   }
// };

const createPaymentIntoDB = async (payLoad: IPayment) => {
  const { forOrderId, checkNumber, method, checkImage, amount, storeId } = payLoad;

  // Step 1: Validate amount is positive
  console.log("Step 1: Validating amount - Input payload:", { amount, storeId, forOrderId, method, checkNumber, checkImage });
  if (amount <= 0) {
    console.log("Step 1: Validation failed - Amount must be positive!");
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be positive!");
  }
  console.log("Step 1: Amount validated successfully.");

  // Step 2: Validate forOrderId is a non-empty array of ObjectIds
  console.log("Step 2: Validating forOrderId - Length:", forOrderId.length, "Values:", forOrderId);
  if (!Array.isArray(forOrderId) || forOrderId.length === 0) {
    console.log("Step 2: Validation failed - forOrderId must be a non-empty array!");
    throw new AppError(httpStatus.BAD_REQUEST, "forOrderId must be a non-empty array!");
  }
  if (!forOrderId.every((id) => Types.ObjectId.isValid(id))) {
    console.log("Step 2: Validation failed - Invalid ObjectId detected in:", forOrderId);
    throw new AppError(httpStatus.BAD_REQUEST, "All forOrderId values must be valid ObjectIds!");
  }
  console.log("Step 2: forOrderId validated successfully.");

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  console.log("Step 3: Started MongoDB session:", session.id);

  try {
    // Begin transaction
    session.startTransaction();
    console.log("Step 3: Transaction started.");

    // Step 3: Verify all forOrderId exist and fetch order details
    console.log("Step 3: Fetching existing orders for IDs:", forOrderId);
    const existingOrders = await OrderModel.find({
      _id: { $in: forOrderId },
      isDeleted: false,
    }).session(session);
    console.log("Step 3: Fetched orders:", existingOrders.map(o => ({ _id: o._id, totalPayable: o.totalPayable, paymentAmountReceived: o.paymentAmountReceived })));

    if (existingOrders.length !== forOrderId.length) {
      console.log("Step 3: Validation failed - Mismatched order count. Expected:", forOrderId.length, "Found:", existingOrders.length);
      throw new AppError(httpStatus.BAD_REQUEST, "One or more orders not found!");
    }
    console.log("Step 3: All orders verified successfully.");

    // Step 4: Validate check payment requirements
    console.log("Step 4: Validating check payment requirements - Method:", method, "CheckNumber:", checkNumber, "CheckImage:", checkImage);
    if (method === "check" && (!checkNumber || !checkImage)) {
      console.log("Step 4: Validation failed - Missing check number or image for check payment!");
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Both check number and image must be provided for check payment!"
      );
    }
    console.log("Step 4: Check payment requirements validated successfully.");

    // Step 5: Calculate total payable amount from orders
    console.log("Step 5: Calculating total payable amount...");
    const totalPayableAmount = existingOrders.reduce((sum, order) => sum + order.totalPayable, 0);
    console.log("Step 5: Total payable amount:", totalPayableAmount);

    // Step 6: Calculate total paid amount from existing payments
    console.log("Step 6: Calculating total paid amount...");
    const totalPaidAmount = existingOrders.reduce((sum, order) => sum + Number(order.paymentAmountReceived), 0);
    console.log("Step 6: Total paid amount:", totalPaidAmount);

    // Step 7: Calculate "to be paid" amount
    console.log("Step 7: Calculating to be paid amount...");
    const toBePaidAmount = totalPayableAmount - totalPaidAmount;
    console.log("Step 7: To be paid amount:", toBePaidAmount);

    // Step 8: Validate payment amount based on number of orders
    console.log("Step 8: Validating payment amount - Amount:", amount, "To be paid:", toBePaidAmount, "Order count:", forOrderId.length);
    if (forOrderId.length === 1) {
      // For single order, allow partial payment but no overpayment
      const order = existingOrders[0];
      const remainingPayable = order.totalPayable - order.paymentAmountReceived;
      console.log("Step 8: Single order - Remaining payable:", remainingPayable);
      if (amount > remainingPayable) {
        console.log("Step 8: Validation failed - Amount exceeds remaining payable for single order!");
        throw new AppError(httpStatus.BAD_REQUEST, "Payment amount cannot exceed the unpaid amount for this order!");
      }
    } else {
      // For multiple orders, require full payment of total remaining unpaid amount with tolerance
      const tolerance = 0.01; // Allow for floating-point precision differences
      if (Math.abs(amount - toBePaidAmount) > tolerance) {
        console.log("Step 8: Validation failed - Amount does not match total unpaid amount for multiple orders! Difference:", Math.abs(amount - toBePaidAmount));
        throw new AppError(httpStatus.BAD_REQUEST, "Full payment of total unpaid amount is required for multiple orders!");
      }
    }
    console.log("Step 8: Payment amount validated successfully.");

    // Step 9: Prepare payment data (single payment record linked to all orders)
    console.log("Step 9: Preparing payment data...");
    const paymentData = {
      storeId,
      forOrderId, // Array of order IDs
      method,
      date: new Date().toISOString(), // Convert to string as per IPayment interface
      amount,
      checkNumber,
      checkImage,
      isDeleted: false, // As per IPayment interface
    };
    console.log("Step 9: Payment data prepared:", paymentData);

    // Step 10: Create payment within transaction
    console.log("Step 10: Creating payment...");
    const createdPayment = await PaymentModel.create([paymentData], { session });
    console.log("Step 10: Payment created:", createdPayment[0]);

    // Step 11: Update each order's paymentAmountReceived, paymentStatus, and openBalance
    console.log("Step 11: Updating orders...");
    const updatePromises = forOrderId.map((orderId, index) => {
      const order = existingOrders[index];
      let newPaymentAmountReceived = order.paymentAmountReceived;
      let openBalance = order.totalPayable - order.paymentAmountReceived;
      let paymentStatus: "paid" | "notPaid" | "partiallyPaid" | "overPaid" = "paid";

      if (forOrderId.length === 1) {
        // For single order, update based on partial payment
        newPaymentAmountReceived += Number(amount); // Increment by the paid amount
        openBalance = order.totalPayable - newPaymentAmountReceived;
        if (openBalance > 0) {
          paymentStatus = "partiallyPaid"; // Partial payment
        } else if (openBalance === 0) {
          paymentStatus = "paid"; // Full payment
        }
      } else {
        // For multiple orders, set to full payment since amount matches toBePaidAmount
        newPaymentAmountReceived = order.totalPayable;
        openBalance = 0;
        paymentStatus = "paid";
      }

      console.log(`Step 11: Updating order ${orderId} - New paymentAmountReceived: ${newPaymentAmountReceived}, openBalance: ${openBalance}, paymentStatus: ${paymentStatus}`);

      return OrderModel.updateOne(
        { _id: orderId, isDeleted: false },
        {
          $set: {
            paymentAmountReceived: newPaymentAmountReceived,
            paymentStatus,
            openBalance,
          },
        },
        { session }
      );
    });

    const updateResults = await Promise.all(updatePromises);
    console.log("Step 11: Update results:", updateResults);
    if (updateResults.some((result) => result.matchedCount === 0)) {
      console.log("Step 11: Validation failed - One or more orders not updated!");
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "One or more orders not found or already deleted!"
      );
    }
    console.log("Step 11: Orders updated successfully.");

    // Step 12: Commit transaction
    console.log("Step 12: Committing transaction...");
    await session.commitTransaction();
    console.log("Step 12: Transaction committed.");

    // Step 13: Return result
    console.log("Step 13: Returning created payment:", createdPayment[0]);
    return createdPayment[0];
  } catch (error) {
    // Step 14: Rollback transaction on error
    await session.abortTransaction();
    throw error instanceof AppError
      ? error
      : new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create payment");
  } finally {
    // Step 15: End session
    console.log("Step 15: Ending session:", session.id);
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
  console.log("Step 1: Starting getCustomersAllPaymentsFromDB - Input ID:", id);

  // Step 2: Query all payments with population
  console.log("Step 2: Querying all payments with population for storeId and forOrderId...");
  const result = await PaymentModel.find({ isDeleted: false , storeId: id})
    .populate("storeId")
    .populate("forOrderId");
  console.log("Step 2: Query result - Total payments found:", result.length, "Sample:", result);

  // Step 3: Convert ID to ObjectId and filter payments
  console.log("Step 3: Converting ID to ObjectId and filtering payments for storeId:", id);
  const objectId = new mongoose.Types.ObjectId(id);
  console.log("Step 3: Converted ObjectId:", objectId);
  const hisPayments = result.filter((p) => p.storeId.equals(objectId));
  console.log("Step 3: Filtered payments count:", hisPayments.length, "Sample:", hisPayments.slice(0, 2));

  // Step 4: Return result
  console.log("Step 4: Returning filtered payments:", hisPayments);
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

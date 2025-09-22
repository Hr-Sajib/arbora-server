import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { OrderServices } from "./order.service";
import { OrderModel } from "./order.model";
import AppError from "../../errors/AppError";
import { exportGroupedProductsToExcel } from "../../utils/exportToExcel";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  console.log(body)
  const result = await OrderServices.createOrderIntoDB(body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Order created successfully",
    data: result,
  });
});

const getOrderInvoicePdf = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const pdfBuffer = await OrderServices.generateOrderInvoicePdf(id);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=arbora-invoice.pdf",
  });

  res.status(httpStatus.OK).send(pdfBuffer);
});

const getDeliverySheetPdf = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const pdfBuffer = await OrderServices.generateDeliverySheetPdf(id);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=delivery-sheet.pdf",
  });

  res.status(httpStatus.OK).send(pdfBuffer);
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrdersFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Orders fetched successfully",
    data: result,
  });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.getSingleOrderFromDB(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Order fetched successfully",
    data: result,
  });
});

const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const existingOrder = await OrderModel.findById(id);

  if (!existingOrder || existingOrder.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  const result = await OrderServices.updateOrderIntoDB(id, updatePayload, req?.user?.role);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Order updated successfully",
    data: result,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.deleteOrderIntoDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Order deleted successfully",
    data: result,
  });
});

// Get Products Grouped By Category
const getProductsGroupedByCategory = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrderServices.getProductsGroupedByCategory();

    // ✅ Check if client wants Excel export
    const shouldDownload = req.query.download === "true";

    if (shouldDownload) {
      return exportGroupedProductsToExcel(result, res);
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Products grouped by category",
      data: result,
    });
  }
);

const getProductSegmentationCtrl = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrderServices.getProductSegmentation();

       // ✅ Check if client wants Excel export
    const shouldDownload = req.query.download === "true";

    if (shouldDownload) {
      return exportGroupedProductsToExcel(result, res);
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Products segmented ..",
      data: result,
    });
  }
);



// Best and worst selling product for dashboard
export const getBestSellingProductsController = catchAsync(
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 10;
    const data = await OrderServices.getBestSellingProducts(limit);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Best selling products fetched successfully",
      data,
    });
  }
);

export const getWorstSellingProductsController = catchAsync(
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 10;
    const data = await OrderServices.getWorstSellingProducts(limit);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Worst selling products fetched successfully",
      data,
    });
  }
);


export const getChart = catchAsync(
  async (req: Request, res: Response) => {
    const data = await OrderServices.getChartData();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Chart data fetched successfully",
      data,
    });
  }
);


// src/app/modules/order/order.controller.ts

export const getOrdersByPONumber = catchAsync(async (req, res) => {
  const { poNumber } = req.params;
  const orders = await OrderServices.getOrdersByPONumber(poNumber);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order data fetched successfully",
    data: orders,
  });
});


const getAllOrdersPDF =  catchAsync(async (req: Request, res: Response) => {
    const pdfBuffer = await OrderServices.generateAllOrdersPdf();
    res.set({
      "Content-Type": "application/pdf",
      'Content-Disposition': 'inline; filename="all-orders.pdf"',
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);

});

const getShipToAddressPdf = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const pdfBuffer = await OrderServices.generateShipToAddressPdf(id);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=ship-to-address.pdf",
  });

  res.status(httpStatus.OK).send(pdfBuffer);
});



const giveCreditToCustomer = catchAsync(async (req: Request, res: Response) => {

  const result = await OrderServices.giveCreditToCustomerForReturnedProducts(req?.body?.orderId, req?.body?.creditAmount, req?.body?.returnedProductInfo)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer updated successfully",
    data: result,
  });

});




export const OrderControllers = {
  createOrder,
  getAllOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
  getOrderInvoicePdf,
  getProductsGroupedByCategory,
  getProductSegmentationCtrl,
  getBestSellingProductsController,
  getWorstSellingProductsController,
  getChart,
  getAllOrdersPDF,
  getDeliverySheetPdf,
  getOrdersByPONumber,
  getShipToAddressPdf,
  giveCreditToCustomer
};
  
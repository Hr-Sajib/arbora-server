import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { IProduct } from "./product.interface";
import { ProductService } from "./product.service";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";
import { generateProductItemNumber } from "../../utils/generateIds";
import { stat } from "fs";

// Create Product
const createProduct = catchAsync(async (req: Request, res: Response) => {
  const payload: IProduct = req.body;
  const result = await ProductService.createProductInDB(payload);
  generateProductItemNumber();

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

// Get All PRoducts
const getAllProducts = catchAsync(async (_req: Request, res: Response) => {
  const result = await ProductService.getAllProductsFromDB();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Products fetched successfully",
    data: result,
  });
});

const getAllPacketSizes = catchAsync(async (_req: Request, res: Response) => {
  const result = await ProductService.getAllPacketSizesFromDB();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Packet sizes fetched successfully",
    data: result,
  });
});

// Get single product
const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.getSingleProductFromDB(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Product fetched successfully",
    data: result,
  });
});

// Update Product
const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload: Partial<IProduct> = req.body;

  const result = await ProductService.updateProductInDB(id, payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});


// get sold to
const getSoldTo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.getProductSoldToWhomFromDB(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Product Sold To information fetched successfully",
    data: result,
  });
});


// Delete product
const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.deleteProductFromDB(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});

// Get all products by category
const getProductsByCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const result = await ProductService.getProductsByCategoryFromDB(categoryId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Products fetched by category successfully",
    data: result,
  });
});

const getAllProductsPdf = catchAsync(async (req: Request, res: Response) => {
  const pdfBuffer = await ProductService.generateAllProductsPdf();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=all-products-report.pdf",
    "Content-Length": pdfBuffer.length,
  });

  res.status(status.OK).send(pdfBuffer);
});

export const ProductController = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getAllPacketSizes,
  getProductsByCategory,
  getAllProductsPdf,
  getSoldTo
};

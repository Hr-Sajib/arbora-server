/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { IContainer } from "./container.interface";
import { ContainerModel } from "./container.model";
import { ProductModel } from "../product/product.model";
import { xlToJson } from "../../utils/xlToJson";
import { ProductService } from "../product/product.service";

/**
 * Creates a container in the database.
 * 
 * @param payLoad - Container data including products.
 * @returns Created container and any failed entries.
 */
export const createContainerIntoDB = async (payLoad: IContainer) => {
  const { containerProducts, containerStatus, shippingCost, containerNumber } = payLoad;

  const failedEntries: any[] = [];
  const enrichedContainerProducts: any[] = [];

  // Calculate total quantity for perCaseShippingCost
  const totalQuantity = containerProducts.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const perUnitShippingCost =
    shippingCost && totalQuantity > 0 ? shippingCost / totalQuantity : 0;

  for (const p of containerProducts) {
    const existingProduct = await ProductModel.findOne({
      itemNumber: p.itemNumber,
    });

    if (!existingProduct) {
      failedEntries.push({
        itemNumber: p.itemNumber,
        reason: 'Product not found',
      });
      continue;
    }

    // Update inventory
    if (containerStatus === 'onTheWay') {
      await ProductService.updateProductInDB(String(existingProduct._id), {
        incomingQuantity: existingProduct.incomingQuantity + p.quantity,
      });
    } else {
      await ProductService.updateProductInDB(String(existingProduct._id), {
        quantity: existingProduct.quantity + p.quantity,
      });
    }

    const perCaseCost = p.quantity > 0 ? p.purchasePrice / p.quantity : 0;

    enrichedContainerProducts.push({
      category: p.category,
      itemNumber: p.itemNumber,
      packetSize: p.packetSize, // Stored as string
      quantity: p.quantity,
      perCaseCost,
      perCaseShippingCost: perUnitShippingCost,
      purchasePrice: p.purchasePrice,
      salesPrice: p.salesPrice,
    });
  }

  if (enrichedContainerProducts.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No valid products found to add in the container.'
    );
  }

  const containerData = {
    containerNumber,
    containerName: payLoad.containerName,
    containerStatus: payLoad.containerStatus || 'onTheWay',
    deliveryDate: payLoad.deliveryDate,
    containerProducts: enrichedContainerProducts,
    shippingCost,
    isDeleted: false,
  };

  console.log('Container data:', JSON.stringify(containerData, null, 2));

  const createdContainer = await ContainerModel.create(containerData);

  return {
    createdContainer,
    failedEntries,
  };
};



const getAllContainersFromDB = async () => {
  const result = await ContainerModel.find({ isDeleted: false });
  return result;
};

const getSingleContainerFromDB = async (id: string) => {
  const result = await ContainerModel.findOne({ _id: id, isDeleted: false });
  return result;
};

const updateContainerIntoDB = async (
  id: string,
  payload: Partial<IContainer>
) => {
  // Fetch the existing container to check current status
  const existingContainer = await ContainerModel.findById(id).where({ isDeleted: false });

  if (!existingContainer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Container not found or already deleted"
    );
  }

  // Prepare update data for container
  const updateData: Partial<IContainer> = {
    containerNumber: payload.containerNumber,
    containerStatus: payload.containerStatus,
    deliveryDate: payload.deliveryDate,
    containerProducts: payload.containerProducts,
  };

  if (payload.shippingCost) {
    updateData.shippingCost = payload.shippingCost;
  }

  // Check if containerStatus is changing from "onTheWay" to "arrived"
  if (
    existingContainer.containerStatus === "onTheWay" &&
    payload.containerStatus === "arrived" &&
    payload.containerProducts &&
    payload.containerProducts.length > 0
  ) {
    for (const product of payload.containerProducts) {
      const productDetails = await ProductModel.findOne({ itemNumber: product.itemNumber });

      if (!productDetails) {
        throw new AppError(httpStatus.NOT_FOUND, `Product with itemNumber ${product.itemNumber} not found`);
      }

      const quantity = product.quantity || 0;

      // Decrease incomingQuantity and increase quantity
      const updatedQuantity = (productDetails.quantity || 0) + quantity;
      const updatedIncomingQuantity = Math.max((productDetails.incomingQuantity || 0) - quantity, 0); // Prevent negative incomingQuantity

      // Update product in database
      await ProductModel.findOneAndUpdate(
        { itemNumber: product.itemNumber },
        {
          $set: {
            quantity: updatedQuantity,
            incomingQuantity: updatedIncomingQuantity,
          },
        },
        { new: true, runValidators: true }
      );
    }
  }

  // Update the container
  const updatedContainer = await ContainerModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).where({ isDeleted: false });

  if (!updatedContainer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Container not updated or already deleted"
    );
  }

  return updatedContainer;
};

const deleteContainerIntoDB = async (id: string) => {
  const result = await ContainerModel.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Container not found");
  }

  return result;
};




/**
 * Imports XLSX data to create a container in the database.
 * 
 * @param fileBuffer - Buffer of the XLSX file.
 * @param containerDetails - Container metadata (name, status, delivery date, shipping cost, container number).
 * @returns Created container entry and any failed entries.
 */
export const xlImportToAddContainerIntoDB = async (
  fileBuffer: Buffer,
  containerDetails: {
    containerName: string;
    containerStatus?: 'arrived' | 'onTheWay';
    deliveryDate: string;
    shippingCost: number;
    containerNumber: string;
  }
) => {
  // Parse items from XLSX
  const jsonData = await xlToJson(fileBuffer);
  console.log('Parsed JSON data:', JSON.stringify(jsonData, null, 2));

  // Validate containerProducts
  const containerProducts = jsonData.map((item) => ({
    category: item.category,
    itemNumber: item.itemNumber,
    packetSize: item.packetSize, // Stored as string
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    salesPrice: item.salesPrice,
    perCaseCost: 0, // Calculated in createContainerIntoDB
    perCaseShippingCost: 0, // Calculated in createContainerIntoDB
  }));

  // Construct container payload
  const containerPayload: IContainer = {
    containerNumber: containerDetails.containerNumber,
    containerName: containerDetails.containerName,
    containerStatus: containerDetails.containerStatus || 'onTheWay',
    deliveryDate: containerDetails.deliveryDate,
    shippingCost: containerDetails.shippingCost,
    containerProducts,
    isDeleted: false,
  };

  // Create the container in DB
  const createdContainerEntry = await createContainerIntoDB(containerPayload);

  // Return created container entry for API response
  return createdContainerEntry;
};


export const ContainerServices = {
  createContainerIntoDB,
  getAllContainersFromDB,
  getSingleContainerFromDB,
  updateContainerIntoDB,
  deleteContainerIntoDB,
  xlImportToAddContainerIntoDB,
};

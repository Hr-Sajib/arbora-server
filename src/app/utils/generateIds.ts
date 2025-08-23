import { ContainerModel } from "../modules/container/container.model";
import { OrderModel } from "../modules/order/order.model";
import { ProductModel } from "../modules/product/product.model";


export const generateProductItemNumber = async () => {
  // Get all product numbers in order
  const products = await ProductModel.find()
    .sort('itemNumber')
    .select('itemNumber');
  
  let nextNumber = 1;
  
  for (const product of products) {
    const matches = product.itemNumber.match(/PRO-(\d+)/);
    if (matches && matches[1]) {
      const currentNumber = parseInt(matches[1], 10);
      if (currentNumber >= nextNumber) {
        nextNumber = currentNumber + 1;
      }
    }
  }
  
  return `PRO-${nextNumber}`;
};

export const generatePONumber = async () => {
  const order = await OrderModel.find();
  return `ORD-${order.length + 1}`;
};

export const generateInvoiceNumber = async (
  storeName: string,
  date: string
) => {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000); // Ensures 5-digit number
  return `INV-${randomFiveDigits}`;
};


export const generateContainerNumber = async () => {
  const count = await ContainerModel.countDocuments();
  return `CON-${count + 1}`;
};

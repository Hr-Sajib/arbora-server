import status from "http-status";
import AppError from "../../errors/AppError";
import { IProduct } from "./product.interface";
import { ProductModel } from "./product.model";
import { CategoryModel } from "../category/category.model";
import { generateProductItemNumber } from "../../utils/generateIds";
import { generatePdf } from "../../utils/pdfCreate";
import * as fs from "node:fs/promises";
import { OrderServices } from "../order/order.service";
import { ICustomer } from "../customer/customer.interface";
import { IOrder } from "../order/order.interface";
import { Types } from "mongoose";

const createProductInDB = async (payload: IProduct | IProduct[]) => {
  // Ensure we're always working with an array internally
  const productsArray = Array.isArray(payload) ? payload : [payload];

  const createdProducts: IProduct[] = [];

  for (const productPayload of productsArray) {
    // 1️⃣ Validate category
    const category = await CategoryModel.findById(productPayload.categoryId);
    if (!category) {
      throw new AppError(
        status.NOT_FOUND,
        `Category not found for product: ${
          productPayload.name || "Unnamed Product"
        }`
      );
    }

    // 2️⃣ Check duplicate barcode or item number
    const existing = await ProductModel.findOne({
      $or: [
        { barcodeString: productPayload.barcodeString },
        { itemNumber: productPayload.itemNumber },
      ],
    });
    if (existing) {
      throw new AppError(
        status.CONFLICT,
        `Product with barcode ${productPayload.barcodeString} or item number already exists`
      );
    }

    const itemNumber = await generateProductItemNumber();

    const productData = { ...productPayload, itemNumber };
    const createdProduct = await ProductModel.create(productData);

    createdProducts.push(createdProduct);
  }

  return Array.isArray(payload) ? createdProducts : createdProducts[0];
};

// Get All Products From DB
const getAllProductsFromDB = async () => {
  return await ProductModel.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .populate("categoryId");
};

const getAllPacketSizesFromDB = async () => {
  const packetSizes = await ProductModel.distinct("packetSize", {
    isDeleted: false,
  });
  return packetSizes;
};

// Get single product
const getSingleProductFromDB = async (id: string) => {
  const product = await ProductModel.findOne({
    _id: id,
    isDeleted: false,
  }).populate("categoryId");

  if (!product) {
    throw new AppError(status.NOT_FOUND, "Product not found");
  }

  return product;
};

// Update product
const updateProductInDB = async (id: string, payload: Partial<IProduct>) => {
  // 1. Check if product exists and not deleted
  const existingProduct = await ProductModel.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!existingProduct) {
    throw new AppError(status.NOT_FOUND, "Product not found");
  }

  // 2. If categoryId is present, validate it
  if (payload.categoryId) {
    const categoryExists = await CategoryModel.findById(payload.categoryId);
    if (!categoryExists) {
      throw new AppError(status.NOT_FOUND, "Invalid category ID");
    }
  }

  // 3. If barcode or itemNumber changed, check for conflicts
  if (payload.barcodeString || payload.itemNumber) {
    const conflict = await ProductModel.findOne({
      $or: [
        { barcodeString: payload.barcodeString },
        { itemNumber: payload.itemNumber },
      ],
      _id: { $ne: id },
      isDeleted: false, // only check against non-deleted products
    });

    if (conflict) {
      throw new AppError(
        status.CONFLICT,
        "Another product with same barcode or item number already exists"
      );
    }
  }

  // 4. Update product
  const updatedProduct = await ProductModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedProduct;
};

// Delete Product From DB

const deleteProductFromDB = async (id: string) => {
  const product = await ProductModel.findById(id);

  if (!product) {
    throw new AppError(status.NOT_FOUND, "Product not found");
  }

  product.isDeleted = true;
  const deletedProduct = await product.save();

  return deletedProduct;
};

const getProductsByCategoryFromDB = async (categoryId: string) => {
  const products = await ProductModel.find({
    categoryId,
    isDeleted: false,
  })
    .populate("categoryId")
    .sort({ createdAt: -1 });

  return products;
};

const generateAllProductsPdf = async (): Promise<Buffer> => {
  const products = await ProductModel.find({ isDeleted: false })
    .populate("categoryId")
    .lean();

  if (!products || products.length === 0) {
    throw new AppError(status.NOT_FOUND, "No products found");
  }

  const firstPageBase64 = await fs.readFile("public/images/firstPage.jpeg", { encoding: "base64" });
  const bodyCoverBase64 = await fs.readFile("public/images/bodyCover.jpeg", { encoding: "base64" });
  const prodsBase64 = await fs.readFile("public/images/prods.jpeg", { encoding: "base64" });
  const lastPageBase64 = await fs.readFile("public/images/lastPage.jpeg", { encoding: "base64" });

  const firstPageDataUrl = `data:image/jpeg;base64,${firstPageBase64}`;
  const bodyCoverDataUrl = `data:image/jpeg;base64,${bodyCoverBase64}`;
  const prodsDataUrl = `data:image/jpeg;base64,${prodsBase64}`;
  const lastPageDataUrl = `data:image/jpeg;base64,${lastPageBase64}`;

  const productsByCategory = products.reduce((acc, product) => {
    const categoryName = (product.categoryId as { name: string } | undefined)?.name || "Others";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(product);
    return acc;
  }, {} as { [key: string]: any[] });

  const chunkArray = (array: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const categoryPages = Object.entries(productsByCategory)
    .sort((a, b) => (a[0] === "Others" ? 1 : b[0] === "Others" ? -1 : 0))
    .map(([categoryName, categoryProducts]) => {
      const productChunks = chunkArray(categoryProducts, 23);
      return productChunks
        .map(
          (chunk, chunkIndex) => `
            <div class="page" style="background-image: url('${bodyCoverDataUrl}')">
              <div class="category-section" style="margin-bottom: 40px; padding-top: 160px;">
                ${chunkIndex === 0 ? `<h3 class="category-title">${categoryName}</h3>` : ""}
                <table class="product-table">
                  <thead>
                    <tr>
                      <th>Item Number</th>
                      <th>Name</th>
                      <th>Packet Size</th>
                      <th>Sales Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${chunk
                      .map(
                        (product, prodIndex) => `
                        <tr style="page-break-inside: avoid; background-color: ${
                          prodIndex % 2 === 0 ? "#ffffff" : "#f9f9f9"
                        };">
                          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${
                            product.itemNumber || "N/A"
                          }</td>
                          <td style="padding: 10px; border: 1px solid #ddd;">${
                            product.name || "N/A"
                          }</td>
                          <td style="padding: 10px; border: 1px solid #ddd;">${
                            product.packetSize || "N/A"
                          }</td>
                          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${
                            product.salesPrice?.toFixed(2) || "N/A"
                          }</td>
                        </tr>
                      `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          `,
        )
        .join("");
    })
    .join("");

  const currentDate = new Date().toLocaleDateString();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PDF A4 Preview</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            background-color: #ccc;
            margin: 0;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          }
          .page {
            width: 794px;
            height: 1123px;
            margin: 0 auto;
            background-size: cover;
            background-position: center;
            position: relative;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            page-break-after: always;
          }
          .about-us {
            padding: 60px;
            padding-top: 160px;
            text-align: justify;
            line-height: 1.6;
            font-size: 16px;
            color: #0b541d;
          }
          .about-title {
            font-size: 24px;
            font-weight: bold;
            color: #388E3C;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #388E3C;
            padding-bottom: 10px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #388E3C;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          .category-section {
            margin-bottom: 40px;
            padding: 60px;
          }
          .category-title {
            font-size: 18px;
            font-weight: bold;
            color: #388E3C;
            margin-top: 20px;
            margin-bottom: 10px;
            page-break-before: avoid;
          }
          .product-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
            page-break-inside: avoid;
          }
          .product-table th {
            background-color: #388E3C;
            color: #fff;
            padding: 10px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #ddd;
          }
          .product-table td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
          }
          .product-table td:last-child {
            text-align: right;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #E4EDE6;
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            position: absolute;
            bottom: 20px;
            width: 100%;
          }
          @page {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="page" style="background-image: url('${firstPageDataUrl}')"></div>
        <div class="page" style="background-image: url('${bodyCoverDataUrl}')">
          <div class="about-us">
            <h2 class="about-title">About Us</h2>
            <p>
              At Arbora Packaging: Where Packaging Meets Purpose, we believe that every package tells a story — one of sustainability, responsibility, and care for our planet. Since our founding, we’ve been committed to providing eco-friendly packaging solutions that make a difference, helping businesses and households reduce their environmental footprint.
            </p>
            <p>
              We proudly serve restaurants, hotels, caterers, and homeowners across the United States, delivering high-quality packaging products that are as functional as they are sustainable. Our products are made from biodegradable sugarcane pulp, offering a greener alternative without compromising on performance or durability.
            </p>
            <h3 class="section-title">Our Mission</h3>
            <p>
              To empower our customers to embrace an eco-friendly lifestyle by making sustainable packaging accessible, reliable, and cost-effective. Every order you place with Arbora Packaging is a step toward a cleaner and healthier planet.
            </p>
            <h3 class="section-title">Why Choose Arbora Packaging?</h3>
            <ul style="margin-left: 20px; padding-left: 0;">
              <li>100% Product Confidence – We guarantee quality and performance in every item we manufacture and distribute.</li>
              <li>On-Time Delivery – Your business runs on schedules, and so do we. Count on us for prompt, reliable service.</li>
              <li>Nationwide Reach – No matter where you are in the U.S., Arbora Packaging is your trusted partner for sustainable packaging solutions.</li>
              <li>Planet-Friendly Materials – Our biodegradable products return to the earth without harming it, closing the loop on waste.</li>
            </ul>
            <p>
              Join us in creating a future where packaging protects both what’s inside and the world outside. With Arbora Packaging, going green has never been easier.
            </p>
          </div>
        </div>
        ${categoryPages}
        <div class="page" style="background-image: url('${prodsDataUrl}')"></div>
        <div class="page" style="background-image: url('${lastPageDataUrl}')">
          <div class="footer">
            Generated on ${currentDate} | Arbora Paper Products<br/>
            For inquiries, contact sales@arboraproducts.com
          </div>
        </div>
      </body>
    </html>
  `;

  const pdfBuffer = await generatePdf(htmlContent);
  return pdfBuffer;
};


export interface IOrderProduct {
  productId: Types.ObjectId | IProduct; // Can be ObjectId or populated IProduct
  quantity: number;
  price: number;
  discount: number;
}

// Simplified result type with only _id and storeName
interface ISoldToCustomer {
  _id: string;
  storeName: string;
}

const getProductSoldToWhomFromDB = async (productId: string): Promise<ISoldToCustomer[]> => {
  // Fetch all orders directly as an array, adjusting for the wrapper
  const orders = await OrderServices.getAllOrdersFromDB();

  // Log orders for debugging
  console.log("All orders fetched:", orders);

  // Filter orders where the productId matches
  const relevantOrders = orders.filter((order: IOrder) =>
    order.products.some((product: IOrderProduct) => {
      // Debug: Log product details
      const productIdStr = product.productId instanceof Types.ObjectId
        ? product.productId.toString()
        : (product.productId as IProduct)._id.toString();
      console.log(`Checking Product ID: ${productIdStr}, Searching for: ${productId}`);
      return productIdStr === productId;
    })
  );

  // Debug: Log relevant orders
  console.log("Relevant orders after filtering:", relevantOrders);

  // If no relevant orders found, return an empty array
  if (relevantOrders.length === 0) {
    console.log(`No orders found for productId: ${productId}`);
    return [];
  }

  // Extract unique customers from the relevant orders
  const soldToCustomers = relevantOrders
    .map((order: IOrder) => {
      // Safely handle populated vs. unpopulated storeId
      if (order.storeId && typeof (order.storeId as unknown as ICustomer).storeName === "string") {
        return order.storeId as unknown as ICustomer;
      }
      return { _id: order.storeId.toString() }; // Fallback to _id if not populated
    })
    .filter((customer: Partial<ICustomer> | { _id: string }, index: number, self: (Partial<ICustomer> | { _id: string })[]) =>
      index === self.findIndex((s: Partial<ICustomer> | { _id: string }) => s._id === customer._id)
    );

  // Format the result with relevant customer details
  const result = soldToCustomers.map((customer: Partial<ICustomer> | { _id: string }) => ({
    _id: customer._id || "",
    storeName: typeof (customer as ICustomer).storeName === "string" ? (customer as ICustomer).storeName : "Unknown",
  }));

  return result;
};


export const ProductService = {
  createProductInDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductInDB,
  deleteProductFromDB,
  getAllPacketSizesFromDB,
  generateAllProductsPdf,
  getProductsByCategoryFromDB,
  getProductSoldToWhomFromDB
};

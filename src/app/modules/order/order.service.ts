/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import * as fs from "node:fs/promises";
import AppError from "../../errors/AppError";
import { IOrder } from "./order.interface";
import { OrderModel } from "./order.model";
import { ProductModel } from "../product/product.model";
import { generatePdf } from "../../utils/pdfCreate";
import { CustomerModel } from "../customer/customer.model";
import {
  generateInvoiceNumber,
  generatePONumber,
} from "../../utils/generateIds";
import mongoose from "mongoose";


const createOrderIntoDB = async (payLoad: IOrder) => {
  const { products, date, shippingCharge, shippingDate } = payLoad;

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if store exists and is not deleted
    const checkExistingStore = await CustomerModel.findById(
      payLoad.storeId
    ).session(session);
    if (!checkExistingStore) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This customer store does not exist!"
      );
    }
    if (checkExistingStore.isDeleted === true) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This customer store was deleted!"
      );
    }

    // Verify product existence and sufficient quantity
    let totalSalesPrice = 0;
    let totalPurchasePrice = 0;
    let discountGiven = 0;

    for (const product of products) {
      const productDetails = await ProductModel.findById(
        product.productId
      ).session(session);
      if (!productDetails) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Product not found: Product ID ${product.productId}`
        );
      }

      const quantity = product.quantity || 1;
      if (!productDetails.quantity || productDetails.quantity < quantity) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for product ${productDetails.name}. Available: ${
            productDetails.quantity || 0
          }, Requested: ${quantity}`
        );
      }

      const salesPrice = product.price || 0;

      const purchasePrice = productDetails.purchasePrice || 0;
      const discount = product.discount || 0;

      totalSalesPrice += salesPrice * quantity;
            // console.log("sales price: ",salesPrice," total price: ", totalSalesPrice)

      totalPurchasePrice += purchasePrice * quantity;
      discountGiven += discount;

      // Update product quantity
      await ProductModel.findByIdAndUpdate(
        product.productId,
        { $inc: { quantity: -quantity } },
        { session }
      );
    }

    const orderAmount = totalSalesPrice - discountGiven;
    const profitAmount = orderAmount - totalPurchasePrice;
    const profitPercentage =
      totalPurchasePrice > 0
        ? parseFloat(((profitAmount / totalPurchasePrice) * 100).toFixed(2))
        : 0;
    const openBalance = orderAmount - (payLoad.paymentAmountReceived || 0);

    const PONumber = await generatePONumber();
    const invoiceNumber = await generateInvoiceNumber(
      checkExistingStore.storeName,
      date
    );



    // Prepare order data
    const orderData = {
      date: payLoad.date,
      invoiceNumber: invoiceNumber,
      PONumber: PONumber,
      storeId: payLoad.storeId,
      paymentDueDate: payLoad.paymentDueDate,
      orderAmount,
      orderStatus: payLoad.orderStatus || "verified",
      paymentAmountReceived: payLoad.paymentAmountReceived || 0,
      discountGiven,
      shippingDate,
      openBalance,
      profitAmount,
      profitPercentage,
      totalPayable: orderAmount,
      paymentStatus: payLoad.paymentStatus || "notPaid",
      products: payLoad.products,
      shippingCharge: shippingCharge,
    };

    // Create order
    const createdOrder = await OrderModel.create([orderData], { session });

    console.log("createdOrder: ___",createdOrder)

    // Commit the transaction
    await session.commitTransaction();
    return createdOrder[0];
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

// const generateOrderInvoicePdf = async (id: string): Promise<Buffer> => {
//   // Fetch order with populated storeId and products.productId
//   const order = await OrderModel.findOne({ _id: id, isDeleted: false })
//     .populate({
//       path: "products.productId",
//       populate: { path: "categoryId" },
//     })
//     .populate("storeId")
//     .lean();

//   if (!order) {
//     throw new AppError(httpStatus.NOT_FOUND, "Order not found or deleted");
//   }

//   // Safely access customer data
//   const customer = (order.storeId as any) || {};

//   // Generate product rows
//   const productRows = order.products
//     .map((orderProduct, index) => {
//       const product = (orderProduct.productId as any) || {};
//       const category = product.categoryId.name || "N/A";
//       const productNumber = product.productNumber || `PROD-${index + 1}`;
//       const productName = product.name || "Unknown Product";
//       const packSize = product.packetSize || "1";
//       const description = `${productName} X ${packSize}`;
//       const salesPrice = product.salesPrice || 0;
//       const quantity = orderProduct.quantity || 1;
//       const discount = orderProduct.discount || 0;
//       const total = salesPrice * quantity - discount;
//       return `
//         <tr style="background-color: ${
//           index % 2 === 0 ? "#ffffff" : "#f9f9f9"
//         };">
//           <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${
//             index + 1
//           }</td>
//           <td style="padding: 8px; border: 1px solid #ddd;">${category}</td>
//           <td style="padding: 8px; border: 1px solid #ddd;">${productNumber}</td>
//           <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
//           <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${quantity}</td>
//           <td style="text-align:right; padding: 8px; border: 1px solid #ddd;">$${salesPrice.toFixed(
//             2
//           )}</td>
//           <td style="text-align:right; padding: 8px; border: 1px solid #ddd;">$${total.toFixed(
//             2
//           )}</td>
//         </tr>
//       `;
//     })
//     .join("");

//   // Read the logo image from the public folder as base64
//   const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
//   const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
//   const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png

//   // Generate HTML content with embedded logo
//   const htmlContent = `
//     <html>
//       <head>
//         <style>
//           body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #333; margin: 0; padding: 10px; background-color: #fff; }
//           .container { max-width: 800px; margin: 0 auto; }
//           .header { text-align: center;height:100px;display: flex; justify-content: space-between; align-items: center; width: 100%; }
//           .logo { width: 120px; margin-right: 10px; }
//           .company-info { color: #555; font-size: 11px; }
//           .contact-info { text-align: left; margin: 0 10px; }
//           .invoice-title { background-color: #388E3C; color: #fff; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-left: 10px; margin-bottom: 55px; }
//           .info-section { display: flex; justify-content: space-between; gap: 4px; margin: 20px 0; }
//           .info-block { width: 48%; background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; border-radius: 4px; line-height: 1.2; }
//           .info-block .label { font-weight: bold; color: #388E3C; }
//           .product-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px}
//           .product-table th { background-color: #388E3C; color: #fff; padding: 5px;font-size:12px; text-align: center; border: 1px solid #ddd; }
//           .product-table td { padding: 8px; border: 1px solid #ddd;font-size: 13px }
//           .totals-table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0; }
//           .totals-table td { padding: 8px; border: 1px solid #ddd; }
//           .totals-table .total-row { background-color: #E8F5E9; }
//           .totals-table .label { font-weight: bold; text-align: left; }
//           .totals-table .value { text-align: right; }
//           .footer { text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #ddd; }
//           .invoice-details-table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 4px; }
//           .invoice-details-table td { padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; }
//           .customer-table {margin-top: 30px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <div>
//             <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
//               <div class="invoice-title">Invoice</div>
//             </div>
//             <div class="contact-info">
//               <p class="company-info">Arbora Products</p>
//               <p class="company-info">11311 Harry Hines Blvd. Suite 514\nDallas TX 75229, USA</p>
//               <p class="company-info">Email: sales@arboraproducts.com</p>
//               <p class="company-info">https://arboraproducts.com</p>
//               <p class="company-info">📞 972-901-9944</p>
//             </div>
//           </div>

//           <table class="customer-table invoice-details-table">
//             <tr>
//               <td><b>Store</b></td>
//               <td><b>Email</b></td>
//               <td><b>Phone</b></td>
//               <td><b>Shipping Date</b></td>
//             </tr>
//             <tr>
//               <td>${customer.storeName || "N/A"}</td>
//               <td>${customer.storePersonEmail || "N/A"}</td>
//               <td>${customer.storePhone || "N/A"}</td>
//               <td>${order.shippingDate || "N/A"}</td>
//             </tr>
//           </table>
//           <div class="info-section">
//             <div class="info-block">
//               <div class="label">Bill To</div>
//               <p>${customer.billingAddress || "N/A"}, City: ${
//     customer.billingCity || "N/A"
//   }, State: ${customer.billingState || "N/A"}, Zip: ${
//     customer.billingZipcode || "N/A"
//   }</p>
//             </div>
//             <div class="info-block">
//               <div class="label">Ship To</div>
//               <p>${customer.billingAddress || "N/A"}, City:  ${
//     customer.billingCity || "N/A"
//   }, State:  ${customer.billingState || "N/A"}, Zip:  ${
//     customer.billingZipcode || "N/A"
//   }</p>
//             </div>
//           </div>

//           <table class="invoice-details-table">
//             <tr>
//               <td>Invoice No</td>
//               <td>PO Number</td>
//               <td>Order Date</td>
//               <td>Due Date</td>
//               <td>Payment Status</td>
//             </tr>
//             <tr>
//               <td><b>${order.invoiceNumber || "N/A"}</b></td>
//               <td><b>${order.PONumber || "N/A"}</b></td>
//               <td><b>${order.date || "N/A"}</b></td>
//               <td><b>${order.paymentDueDate || "N/A"}</b></td>
//               <td><b>${order.paymentStatus || "N/A"}</b></td>
//             </tr>
//           </table>

//           <table class="product-table">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Category</th>
//                 <th>Product No.</th>
//                 <th>Description</th>
//                 <th>Qty</th>
//                 <th>Unit Price</th>
//                 <th>Price</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${productRows}
//             </tbody>
//           </table>

//           <table class="totals-table">
//             <tr><td class="label">Subtotal:</td><td class="value">$${(
//               (order.orderAmount || 0) + (order.discountGiven || 0)
//             ).toFixed(2)}</td></tr>
//             <tr><td class="label">Discount:</td><td class="value">$${
//               order.discountGiven || "0"
//             }</td></tr>
//             <tr><td class="label">Total:</td><td class="value">$${(
//               order.orderAmount || 0
//             ).toFixed(2)}</td></tr>
//             <tr><td class="label">Shipping Charge:</td><td class="value">$${
//               order.shippingCharge || 0
//             }</td></tr>
//             <tr><td class="label">Total Payable:</td><td class="value">$${
//               Number(order.shippingCharge) + order.orderAmount || 0
//             }</td></tr>
//             <tr><td class="label">Paid:</td><td class="value">$${
//               order.paymentAmountReceived || 0
//             }</td></tr>
//             <tr><td class="label">Remaining Payable:</td><td class="value">$${
//               order.openBalance || 0
//             }</td></tr>
//           </table>

//           <div class="footer">
//             Payments due by the due date | Overdue balances incur a 2% monthly interest | No returns after 14 days | Unpaid merchandise remains property of Arbora until fully paid.<br/>
//             Thank you for choosing Arbora for your paper product needs!
//           </div>
//         </div>
//       </body>
//     </html>
//   `;

//   // Generate PDF using the utility function
//   const pdfBuffer = await generatePdf(htmlContent);
//   return pdfBuffer;
// };

const generateOrderInvoicePdf = async (id: string): Promise<Buffer> => {
  // Fetch order with populated storeId and products.productId
  const order = await OrderModel.findOne({ _id: id, isDeleted: false })
    .populate({
      path: "products.productId",
      populate: { path: "categoryId" },
    })
    .populate("storeId")
    .lean();

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found or deleted");
  }

  // Safely access customer data
  const customer = (order.storeId as any) || {};

  // Generate product rows
  const productRows = order.products
    .map((orderProduct, index) => {
      const product = (orderProduct.productId as any) || {};
      const category = product.categoryId.name || "N/A";
      const productNumber = product.productNumber || `PROD-${index + 1}`;
      const productName = product.name || "Unknown Product";
      const packSize = product.packetSize || "1";
      const description = `${productName} X ${packSize}`;
      const salesPrice = product.salesPrice || 0;
      const quantity = orderProduct.quantity || 1;
      const discount = orderProduct.discount || 0;
      const total = salesPrice * quantity - discount;
      return `
        <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9f9f9"}; border-bottom: 1px solid #000000;">
          <td style="padding: 4px; font-size: 12px; border: 1px solid #000000; text-align: center;">${index + 1}</td>
          <td style="padding: 4px; font-size: 12px; border: 1px solid #000000;">${category}</td>
          <td style="padding: 4px; font-size: 12px; border: 1px solid #000000;">${productNumber}</td>
          <td style="padding: 4px; font-size: 12px; border: 1px solid #000000;">${description}</td>
          <td style="padding: 4px; font-size: 12px; border: 1px solid #000000; text-align: center;">${quantity}</td>
          <td style="padding: 4px; font-size: 12px; border: 1px solid #000000; text-align: right;">$${salesPrice.toFixed(2)}</td>
          <td style="padding: 4px; font-size: 12px; border: 1px solid #000000; text-align: right;">$${total.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png"; // Updated path based on your component
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  // Generate HTML content with updated date format
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; padding-top:0px; background-color: #fff; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .logo { width: 168px; margin-top: 40px; } /* 42px in Tailwind w-42 approximated to 168px */
          .company-info { text-align: left; color: #555; font-size: 13px; line-height: 50%; }
          .invoice-details { height: 128px; margin-top: 8px; } /* h-32 in Tailwind approximated to 128px */
          .invoice-details table { border: 1.5px solid #000000; border-collapse: collapse;}
          .invoice-details th { border: 2px solid #000000; background-color: #d1d5db; padding: 2px; font-size: 12px; text-align: center; }
          .invoice-details td { border: 2px solid #000000; padding: 12px; font-size: 12px; }
          .invoice-details .title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 8px; margin-top: 8px; }
          .address-boxes { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
          .address-box { width: 48%; border: 1px solid #000000; padding: 8px; }
          .address-box .label { font-weight: bold; padding-left: 8px; background-color: #d1d5db; margin-bottom: 8px; font-size: 12px; }
          .address-box p { font-size: 12px; padding: 0 8px; }
          .customer-table, .invoice-details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .customer-table td, .invoice-details-table td { padding: 2px; font-size: 12px; border: 1px solid #000000; text-align: center; }
          .customer-table td:first-child, .invoice-details-table td:first-child { font-weight: bold; background-color: #d1d5db; }
          .product-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; margin-top: 40px; }
          .product-table th { background-color: #d1d5db; color: #000000ff; padding: 2px; font-size: 12px; border: 1px solid #000000; text-align: center; }
          .product-table td { padding: 5px; font-size: 12px; border: 1px solid #000000; }
          .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          .totals-table td { padding: 2px; border: 1px solid #9ea29fff; }
          .totals-table td:first-child { text-align: right; }
          .totals-table td:last-child { text-align: right; border: 1px solid #9ea29fff; }

          .totals-table-th { 
            font-weight: 600; 
          }

          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            margin-top: 12px;
            padding-top: 12px;
            line-height: 1.4;
            page-break-inside: avoid; /* helps keep footer together on PDF */
          }

          #footer-text {
            margin: 0;                /* reset default <p> margins for tighter layout */
            font-size: 10px;          /* readable size in PDFs */
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
            <div class="company-info">
              <p>Arbora Products</p>
              <p>11311 Harry Hines Blvd. Suite 514</p>
              <p>Dallas TX 75229, USA</p>
              <p>Email: sales@arboraproducts.com</p>
              <p>https://arboraproducts.com</p>
              <p>📞 972-901-9944</p>
            </div>
            <div class="invoice-details">
              <p class="title">INVOICE</p>
              <table>
                <tr>
                  <th>Date</th>
                  <th>No#</th>
                </tr>
                <tr>
                  <td>${order.shippingDate ? order.shippingDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2-$3-$1") : "N/A"}</td>
                  <td><b>${order.invoiceNumber || "N/A"}</b></td>
                </tr>
              </table>
            </div>
          </div>
          <div class="address-boxes">
            <div class="address-box">
              <div class="label">Bill To</div>
              <p>${customer.billingAddress || "N/A"}, City: ${customer.billingCity || "N/A"}, State: ${customer.billingState || "N/A"}, Zip: ${customer.billingZipcode || "N/A"}</p>
            </div>
            <div class="address-box">
              <div class="label">Ship To</div>
              <p>${customer.shippingAddress || "N/A"}, City: ${customer.shippingCity || "N/A"}, State: ${customer.shippingState || "N/A"}, Zip: ${customer.shippingZipcode || "N/A"}</p>
            </div>
          </div>
          <table class="customer-table">
            <tr>
              <td>Store</td>
              <td>Email</td>
              <td>Phone</td>
              <td>Shipping Date</td>
            </tr>
            <tr>
              <td>${customer.storeName || "N/A"}</td>
              <td>${customer.storePersonEmail || "N/A"}</td>
              <td>${customer.storePhone || "N/A"}</td>
              <td>${order.shippingDate ? order.shippingDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2-$3-$1") : "N/A"}</td>
            </tr>
          </table>
          <table class="invoice-details-table">
            <tr>
              <td>Invoice No</td>
              <td>PO Number</td>
              <td>Order Date</td>
              <td>Due Date</td>
              <td>Payment Status</td>
            </tr>
            <tr>
              <td>${order.invoiceNumber || "N/A"}</td>
              <td>${order.PONumber || "N/A"}</td>
              <td>${order.date ? order.date.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2-$3-$1") : "N/A"}</td>
              <td>${order.paymentDueDate ? order.paymentDueDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2-$3-$1") : "N/A"}</td>
              <td>${order.paymentStatus || "N/A"}</td>
            </tr>
          </table>
          <table class="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Product No.</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
          <table class="totals-table">
            <tr><td class="totals-table-th">Subtotal</td><td class="totals-table-th">$${((order.orderAmount || 0) + (order.discountGiven || 0)).toFixed(2)}</td></tr>
            <tr><td class="totals-table-th">Discount</td><td class="totals-table-th">$${order.discountGiven || "0"}</td></tr>
            <tr><td class="totals-table-th">Total</td><td class="totals-table-th">$${order.orderAmount ? (order.orderAmount).toFixed(2) : "0"}</td></tr>
            <tr><td class="totals-table-th">Shipping Charge</td><td class="totals-table-th">$${order.shippingCharge || "0"}</td></tr>
            <tr><td class="totals-table-th">Total Payable</td><td class="totals-table-th">$${Number(order.shippingCharge) + (order.orderAmount || 0)}</td></tr>
            <tr><td class="totals-table-th">Paid</td><td class="totals-table-th">$${order.paymentAmountReceived || "0"}</td></tr>
            <tr><td class="totals-table-th">Remaining Payable</td><td class="totals-table-th">$${order.openBalance || "0"}</td></tr>
          </table>
          <div class="footer">
            <p id="footer-text">Check payable to Arbora Products | Overdue balances incur a 3% monthly interest <br/> No returns after 14 days | Unpaid merchandise remains property of Arbora until fully paid.<br />Customers are liable for any legal charges | $50 charge on all returned checks</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Generate PDF using the utility function
  const pdfBuffer = await generatePdf(htmlContent);
  return pdfBuffer;
};


const generateShipToAddressPdf = async (id: string): Promise<Buffer> => {
  // Fetch order with populated storeId and products.productId
  const order = await OrderModel.findOne({ _id: id, isDeleted: false })
    .populate({
      path: "products.productId",
      populate: { path: "categoryId" },
    })
    .populate("storeId")
    .lean();

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found or deleted");
  }

  // Safely access customer data
  const customer = (order.storeId as any) || {};

  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png

  // Generate product rows
  const productRows = order.products
    .map((orderProduct, index) => {
      const product = (orderProduct.productId as any) || {};
      const productName = product.name || "Paper Product";
      const productNumber = product.productNumber || `PROD-${index + 1}`;
      const packSize = product.packetSize || "1";
      const description = `${productName} X ${packSize}`;
      const quantity = orderProduct.quantity || 1;
      return `
        <tr style="background-color: ${
          index % 2 === 0 ? "#ffffff" : "#f9f9f9"
        };">
          <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${
            index + 1
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${productName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${productNumber}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
          <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${quantity}</td>
        </tr>
      `;
    })
    .join("");

  // Generate HTML content for delivery sheet
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #333; margin: 0; padding: 10px; background-color: #fff; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; height: 100px; display: flex; justify-content: space-between; align-items: center; width: 100%; }
          .logo { width: 120px; margin-right: 10px; }
          .company-info { color: #555; font-size: 11px; }
          .contact-info { text-align: left; margin: 0 10px; }
          .delivery-title { background-color: #388E3C; color: #fff; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-left: 10px; margin-bottom: 55px; }
          .info-section { display: flex; justify-content: space-between; gap: 4px; margin: 20px 0; }
          .info-block { width: 48%; background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; border-radius: 4px; line-height: 1.2; }
          .info-block .label { font-weight: bold; color: #388E3C; }
          .product-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .product-table th { background-color: #388E3C; color: #fff; padding: 5px; font-size: 12px; text-align: center; border: 1px solid #ddd; }
          .product-table td { padding: 8px; border: 1px solid #ddd; font-size: 13px; }
          .footer { text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #ddd; }
          .customer-table { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
              <div class="delivery-title">Ship To Address</div>
            </div>
            <div class="contact-info">
              <p class="company-info">Arbora Products</p>
              <p class="company-info">11311 Harry Hines Blvd. Suite 514\nDallas TX 75229, USA</p>
              <p class="company-info">Email: sales@arboraproducts.com</p>
              <p class="company-info">https://arboraproducts.com</p>
              <p class="company-info">📞 972-901-9944</p>
            </div>
          </div>

          <table class="customer-table">
            <tr>
              <td><b>Store</b></td>
              <td><b>Shipping Date</b></td>
            </tr>
            <tr>
              <td>${customer.storeName || "N/A"}</td>
              <td>${order.shippingDate || "N/A"}</td>
            </tr>
          </table>
          <div class="info-section">
            <div class="info-block">
              <div class="label">Ship To</div>
              <p>${customer.shippingAddress || "N/A"}, City: ${
    customer.shippingCity || "N/A"
  }, State: ${customer.shippingState || "N/A"}, Zip: ${
    customer.shippingZipcode || "N/A"
  }</p>
            </div>
          </div>

          <table class="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Product No.</th>
                <th>Description</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <div class="footer">
            Please verify the items upon delivery. Contact us at sales@arboraproducts.com for any discrepancies.<br/>
            Thank you for choosing Arbora for your paper product needs!
          </div>
        </div>
      </body>
    </html>
  `;

  // Generate PDF using the utility function
  const pdfBuffer = await generatePdf(htmlContent);
  return pdfBuffer;
};

const generateDeliverySheetPdf = async (id: string): Promise<Buffer> => {
  // Fetch order with populated storeId and products.productId
  const order = await OrderModel.findOne({ _id: id, isDeleted: false })
    .populate({
      path: "products.productId",
      populate: { path: "categoryId" },
    })
    .populate("storeId")
    .lean();

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found or deleted");
  }

  // Safely access customer data
  const customer = (order.storeId as any) || {};

  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png

  // Generate product rows
  const productRows = order.products
    .map((orderProduct, index) => {
      const product = (orderProduct.productId as any) || {};
      const category = product.categoryId.name || "N/A";
      const productNumber = product.productNumber || `PROD-${index + 1}`;
      const productName = product.name || "Paper Product";
      const packSize = product.packetSize || "1";
      const description = `${productName} X ${packSize}`;
      const quantity = orderProduct.quantity || 1;
      return `
        <tr style="background-color: ${
          index % 2 === 0 ? "#ffffff" : "#f9f9f9"
        };">
          <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${
            index + 1
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${category}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${productNumber}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
          <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;"></td> <!-- Verification column -->
        </tr>
      `;
    })
    .join("");

  // Generate HTML content for Delivery Sheet
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #333; margin: 0; padding: 10px; background-color: #fff; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; height: 100px; display: flex; justify-content: space-between; align-items: center; width: 100%; }
          .logo { width: 120px; margin-right: 10px; }
          .company-info { color: #555; font-size: 11px; }
          .contact-info { text-align: left; margin: 0 10px; }
          .delivery-title { background-color: #388E3C; color: #fff; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-left: 10px; margin-bottom: 55px; }
          .info-section { display: flex; justify-content: space-between; gap: 4px; margin: 20px 0; }
          .info-block { width: 48%; background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; border-radius: 4px; line-height: 1.2; }
          .info-block .label { font-weight: bold; color: #388E3C; }
          .product-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .product-table th { background-color: #388E3C; color: #fff; padding: 5px; font-size: 12px; text-align: center; border: 1px solid #ddd; }
          .product-table td { padding: 8px; border: 1px solid #ddd; font-size: 13px; }
          .footer { text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #ddd; }
          .customer-table { margin-top: 40px; }
          .customer-table, .invoice-details-table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 4px; }
          .customer-table td, .invoice-details-table td { padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
              <div class="delivery-title">Delivery Sheet</div>
            </div>
            <div class="contact-info">
              <p class="company-info">Arbora Products</p>
              <p class="company-info">11311 Harry Hines Blvd. Suite 514\nDallas TX 75229, USA</p>
              <p class="company-info">Email: sales@arboraproducts.com</p>
              <p class="company-info">https://arboraproducts.com</p>
              <p class="company-info">📞 972-901-9944</p>
            </div>
          </div>

          <table style="margin-top: 30px;" class="customer-table invoice-details-table">
            <tr>
              <td><b>Store</b></td>
              <td><b>Email</b></td>
              <td><b>Phone</b></td>
              <td><b>Shipping Date</b></td>
            </tr>
            <tr>
              <td>${customer.storeName || "N/A"}</td>
              <td>${customer.storePersonEmail || "N/A"}</td>
              <td>${customer.storePhone || "N/A"}</td>
              <td>${order.shippingDate || "N/A"}</td>
            </tr>
          </table>
          <div class="info-section">
            <div class="info-block">
              <div class="label">Bill To</div>
              <p>${customer.billingAddress || "N/A"}, City: ${
    customer.billingCity || "N/A"
  }, State: ${customer.billingState || "N/A"}, Zip: ${
    customer.billingZipcode || "N/A"
  }</p>
            </div>
            <div class="info-block">
              <div class="label">Ship To</div>
              <p>${customer.billingAddress || "N/A"}, City: ${
    customer.billingCity || "N/A"
  }, State: ${customer.billingState || "N/A"}, Zip: ${
    customer.billingZipcode || "N/A"
  }</p>
            </div>
          </div>

          <table class="invoice-details-table">
            <tr>
              <td>Invoice No</td>
              <td>PO Number</td>
              <td>Order Date</td>
              <td>Due Date</td>
            </tr>
            <tr>
              <td><b>${order.invoiceNumber || "N/A"}</b></td>
              <td><b>${order.PONumber || "N/A"}</b></td>
              <td><b>${order.date || "N/A"}</b></td>
              <td><b>${order.paymentDueDate || "N/A"}</b></td>
            </tr>
          </table>

          <table class="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Product No.</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <div class="footer">
            Please verify the delivery contents upon receipt | Contact us at sales@arboraproducts.com for any discrepancies.<br/>
            Thank you for your business with Arbora!
          </div>
        </div>
      </body>
    </html>
  `;

  // Generate PDF using the utility function
  const pdfBuffer = await generatePdf(htmlContent);
  return pdfBuffer;
};

const getAllOrdersFromDB = async () => {
  const result = await OrderModel.find({ isDeleted: false })
    .populate("storeId")
    .populate("products.productId");
  return result;
};

const getSingleOrderFromDB = async (id: string) => {
  const result = await OrderModel.findOne({ _id: id, isDeleted: false })
    .populate({
      path: "products.productId",
      populate: { path: "categoryId" }, // 👈 populates categoryId inside productId
    })
    .populate("storeId")
    .lean();

  return result;
};

const updateOrderIntoDB = async (id: string, payload: Partial<IOrder>) => {
  // Fetch the existing order to get current products and payment values
  const existingOrder = await OrderModel.findById(id).populate(
    "products.productId"
  );
  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }
  if (existingOrder.orderStatus == "cancelled") {
    throw new AppError(httpStatus.NOT_FOUND, "Can't update cancelled orders!");
  }
  

  let totalSalesPrice = 0;
  let totalPurchasePrice = 0;
  let discountGiven = 0;
  let orderAmount = existingOrder.orderAmount || 0; // Default to existing value
  let profitAmount = existingOrder.profitAmount || 0; // Default to existing value
  let profitPercentage = existingOrder.profitPercentage || 0; // Default to existing value

  // Check if payload.products exists and if its length differs from existing products
  if (
    payload.products) {
    for (const product of payload.products) {
      const productDetails = await ProductModel.findById(product.productId);

      const salesPrice = productDetails?.salesPrice || 0;
      const purchasePrice = productDetails?.purchasePrice || 0;
      const quantity = product.quantity || 1;
      const discount = product.discount || 0;

      totalSalesPrice += salesPrice * quantity;
      totalPurchasePrice += purchasePrice * quantity;
      discountGiven += discount;
    }

    // Recalculate derived values
    orderAmount = totalSalesPrice - discountGiven;
    profitAmount = orderAmount - totalPurchasePrice;

    // console.log(`orderAmount (${orderAmount}) = `)
    profitPercentage =
      totalPurchasePrice > 0
        ? parseFloat(((profitAmount / totalPurchasePrice) * 100).toFixed(2))
        : 0;
  } else {
    // If no change in products length, retain existing values
    totalSalesPrice =
      existingOrder.orderAmount + (existingOrder.discountGiven || 0);
    discountGiven = existingOrder.discountGiven || 0;
  }

  if (
    (existingOrder.orderStatus == "verified" ||  existingOrder.orderStatus == "completed" ) &&
    payload.orderStatus === "cancelled"
  ) {
    try {
      // Iterate through the products in the existing order
      for (const orderProduct of existingOrder.products) {
        const product = await ProductModel.findById(orderProduct.productId);
        if (!product) {
          throw new Error(
            `Product with ID ${orderProduct.productId} not found`
          );
        }

        // Add back the quantity from the cancelled order
        product.quantity += orderProduct.quantity;
        await product.save();
      }
    } catch (error) {
      console.error("Error restoring product quantities:", error);
      throw new Error(
        "Failed to restore product quantities for cancelled order"
      );
    }
  }

  const totalPayable =
    orderAmount +
    (payload.shippingCharge
      ? payload.shippingCharge
      : existingOrder.shippingCharge);
  // Calculate openBalance
  const openBalance =
    totalPayable -
    existingOrder.paymentAmountReceived -
    (payload.paymentAmountReceived ? payload.paymentAmountReceived : 0);

  // Prepare update data
  const updateData = {
    date: payload.date,
    storeId: payload.storeId,
    paymentDueDate: payload.paymentDueDate,
    orderAmount,
    totalPayable: totalPayable,
    orderStatus: payload.orderStatus,
    shippingCharge: payload.shippingCharge,
    paymentAmountReceived:
      payload.paymentAmountReceived || existingOrder.paymentAmountReceived,
    discountGiven,
    openBalance,
    profitAmount,
    profitPercentage,
    products: payload.products || existingOrder.products,
    paymentStatus: payload.paymentStatus,
  };

  // Update the order
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).populate("products.productId");

  if (!updatedOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not updated");
  }

  return updatedOrder;
};

const deleteOrderIntoDB = async (id: string) => {
  const existingOrder = await OrderModel.findById(id).populate("products.productId");

  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  // Restore product quantities only if order status is "verified"
  if (existingOrder.orderStatus === "verified") {
    try {
      // Iterate through the products in the existing order
      for (const orderProduct of existingOrder.products) {
        const product = await ProductModel.findById(orderProduct.productId);
        if (!product) {
          throw new Error(`Product with ID ${orderProduct.productId} not found`);
        }

        // Add back the quantity from the deleted order
        product.quantity += orderProduct.quantity;
        await product.save();
      }
    } catch (error) {
      console.error("Error restoring product quantities:", error);
      throw new Error("Failed to restore product quantities for deleted order");
    }
  }

  // Mark the order as deleted regardless of status
  const result = await OrderModel.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  return result;
};

// Fetch all products grouped by category, considering only non-deleted products
const getProductsGroupedByCategory = async () => {
  try {
    const grouped = await ProductModel.aggregate([
      // Step 1: Filter out deleted products
      {
        $match: {
          isDeleted: false,
        },
      },
      // Step 2: Join with categories collection
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      // Step 3: Unwind categoryInfo array to get single category object
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true, // Preserve products even if category is missing
        },
      },
      // Step 4: Group by categoryId
      {
        $group: {
          _id: "$categoryId",
          category: { $first: "$categoryInfo" },
          products: { $push: "$$ROOT" },
        },
      },
      // Step 5: Project the desired output structure
      {
        $project: {
          category: {
            _id: "$category._id",
            name: "$category.name",
            description: "$category.description",
          },
          products: 1,
        },
      },
    ]);

    return grouped;
  } catch (error) {
    console.error("Error in getProductsGroupedByCategory:", error);
    throw new Error("Failed to fetch grouped products");
  }
};

// Helper function to generate combinations of 2 or 3 elements from an array
function getCombinations<T>(array: T[], size: number): T[][] {
  const results: T[][] = [];

  function combine(start: number, current: T[]) {
    if (current.length === size) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      combine(i + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return results;
}
// Best and wors"data": {t selling product for dashboard
const getProductSalesStats = async () => {
  const stats = await OrderModel.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: "$products" },
    {
      $group: {
        _id: {
          productId: "$products.productId",
          orderId: "$_id",
        },
        quantity: { $sum: "$products.quantity" },
      },
    },
    {
      $group: {
        _id: "$_id.productId",
        totalQuantity: { $sum: "$quantity" },
        numberOfOrders: { $sum: 1 },
      },
    },
    {
      $addFields: {
        orderScore: { $multiply: ["$totalQuantity", "$numberOfOrders"] },
      },
    },
    {
      $group: {
        _id: null,
        totalMarketQuantity: { $sum: "$totalQuantity" },
        products: { $push: "$$ROOT" },
      },
    },
    { $unwind: "$products" },
    {
      $project: {
        _id: "$products._id",
        totalQuantity: "$products.totalQuantity",
        numberOfOrders: "$products.numberOfOrders",
        orderScore: "$products.orderScore",
        revenuePercentage: {
          $multiply: [
            { $divide: ["$products.totalQuantity", "$totalMarketQuantity"] },
            100,
          ],
        },
      },
    },
  ]);

  const enriched = await Promise.all(
    stats.map(async (item) => {
      const product = await ProductModel.findById(item._id).lean();
      return {
        ...item,
        name: product?.name || "Unknown Product",
        itemNumber: product?.itemNumber || null,
      };
    })
  );

  return enriched;
};

const getBestSellingProducts = async (limit: number) => {
  const stats = await getProductSalesStats();
  return stats.sort((a, b) => b.orderScore - a.orderScore).slice(0, limit);
};

const getWorstSellingProducts = async (limit: number) => {
  const stats = await getProductSalesStats();
  return stats.sort((a, b) => a.orderScore - b.orderScore).slice(0, limit);
};

const getProductSegmentation = async (
  topN: number = 10
): Promise<{ combination: string[]; frequency: number }[]> => {
  // Fetch all non-deleted orders
  const orders = await OrderModel.find({ isDeleted: false }).lean();

  // Fetch all product IDs from orders
  const productIds = [
    ...new Set(
      orders.flatMap((order) =>
        order.products.map((p) => p.productId.toString())
      )
    ),
  ];

  // Fetch product names from ProductModel
  const products = await ProductModel.find({ _id: { $in: productIds } })
    .select("_id name")
    .lean();
  const productNameMap = new Map(
    products.map((p) => [p._id.toString(), p.name || "Unknown Product"])
  );

  // Dictionary to store combination frequencies
  const combinationCounts: { [key: string]: number } = {};

  // Process each order
  for (const order of orders) {
    // Extract and sort product IDs from the order
    const productIds = order.products.map((p) => p.productId.toString()).sort();

    // Skip orders with no products
    if (productIds.length === 0) continue;

    // Use the full combination as the key
    const comboKey = productIds.join(",");
    combinationCounts[comboKey] = (combinationCounts[comboKey] || 0) + 1;
  }

  // Convert to array, map IDs to names, and sort by frequency
  const result = Object.entries(combinationCounts)
    .map(([key, frequency]) => ({
      combination: key
        .split(",")
        .map((id) => productNameMap.get(id) || "Unknown Product"),
      frequency,
    }))
    .sort(
      (a, b) =>
        b.frequency - a.frequency || a.combination.length - b.combination.length
    )
    .slice(0, topN);

  return result.slice(0, 4);
};

// src/app/modules/order/order.service.ts

const getOrdersByPONumber = async (poNumber: string) => {
  const orders = await OrderModel.find({ PONumber: poNumber, isDeleted: false })
    .populate("storeId")
    .populate("products.productId");
  return orders;
};

const getChartData = async () => {
  // Fetch all orders and customers (including deleted for historical data)
  const orders = await OrderModel.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const customers = await CustomerModel.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Initialize result object
  const result: {
    orders: { year: number; month: number; count: number }[];
    customers: { year: number; month: number; count: number }[];
  } = { orders: [], customers: [] };

  // Get unique year-month combinations
  const yearMonths = new Set<string>();
  orders.forEach((o) => yearMonths.add(`${o._id.year}-${o._id.month}`));
  customers.forEach((c) => yearMonths.add(`${c._id.year}-${c._id.month}`));

  // Create a map for easier lookup
  const orderMap = new Map(
    orders.map((o) => [`${o._id.year}-${o._id.month}`, o.count])
  );
  const customerMap = new Map(
    customers.map((c) => [`${c._id.year}-${c._id.month}`, c.count])
  );

  // Fill result arrays with all year-month combinations
  Array.from(yearMonths)
    .map((ym) => {
      const [year, month] = ym.split("-").map(Number);
      return { year, month };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .forEach(({ year, month }) => {
      result.orders.push({
        year,
        month,
        count: orderMap.get(`${year}-${month}`) || 0,
      });
      result.customers.push({
        year,
        month,
        count: customerMap.get(`${year}-${month}`) || 0,
      });
    });

  return result;
};

const generateAllOrdersPdf = async (): Promise<Buffer> => {
  console.log("Starting generateAllOrdersPdf function"); // Debug: Start of function

  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png

  // Fetch all non-deleted orders with populated storeId and products.productId
  const orders = await OrderModel.find({ isDeleted: false })
    .populate("products.productId")
    .populate("storeId")
    .lean();
  console.log("Fetched orders count:", orders.length); // Debug: Log number of orders fetched

  if (!orders || orders.length === 0) {
    console.log("No orders found, throwing NOT_FOUND error"); // Debug: Log error condition
    throw new AppError(httpStatus.NOT_FOUND, "No orders found");
  }

  // Generate HTML content for all orders
  console.log("Generating order sections for", orders.length, "orders"); // Debug: Start of order sections generation
  const orderSections = orders
    .map((order, index) => {
      console.log(`Processing order ${index + 1}`); // Debug: Log each order processing
      const customer = (order.storeId as any) || {};

      // Generate product rows
      console.log(
        `Generating product rows for order ${index + 1} with ${
          order.products.length
        } products`
      ); // Debug: Log product row generation
      const productRows = order.products
        .map((orderProduct, prodIndex) => {
          const product = (orderProduct.productId as any) || {};
          const salesPrice = product.salesPrice || 0;
          const quantity = orderProduct.quantity || 1;
          const discount = orderProduct.discount || 0;
          const total = salesPrice * quantity - discount;
          return `
            <tr style="background-color: ${
              prodIndex % 2 === 0 ? "#ffffff" : "#f9f9f9"
            };">
              <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${
                prodIndex + 1
              }</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
                product.name || "Paper Product"
              }</td>
              <td style="text-align:center; padding: 8px; border: 1px solid #ddd;">${quantity}</td>
              <td style="text-align:right; padding: 8px; border: 1px solid #ddd;">$${salesPrice}</td>
              <td style="text-align:right; padding: 8px; border: 1px solid #ddd;">$${total}</td>
            </tr>
          `;
        })
        .join("");

      // Generate HTML section for each order
      return `
        <div class="order-section" style="page-break-after: always;">
          <h3>Order ${index + 1}: Sales Order Invoice</h3>
          <table class="info-table">
            <tr>
              <td>
                <span class="highlight">Bill To:</span><br/>
                ${customer.storeName || "N/A"}<br/>
                ${customer.billingAddress || "N/A"}, ${
        customer.billingCity || "N/A"
      }, ${customer.billingState || "N/A"}, ${
        customer.billingZipcode || "N/A"
      }<br/>
                Phone: ${customer.storePhone || "N/A"}<br/>
                Contact: ${customer.storePersonName || "N/A"}
              </td>
              <td>
                <span class="highlight">Invoice Details:</span><br/>
                Invoice No: ${order.invoiceNumber || "N/A"}<br/>
                PO Number: ${order.PONumber || "N/A"}<br/>
                Date: ${order.date || "N/A"}<br/>
                Due Date: ${order.paymentDueDate || "N/A"}<br/>
                Payment Status: ${order.paymentStatus || "N/A"}<br/>
                Order Status: ${order.orderStatus || "N/A"}
              </td>
            </tr>
          </table>
          <div class="info-section">
            <div class="info-block">
              <div class="label">Bill To</div>
              <p>${customer.billingAddress || "N/A"}, City: ${
        customer.billingCity || "N/A"
      }, State: ${customer.billingState || "N/A"}, Zip: ${
        customer.billingZipcode || "N/A"
      }</p>
            </div>
            <div class="info-block">
              <div class="label">Ship To</div>
              <p>${customer.billingAddress || "N/A"}, City: ${
        customer.billingCity || "N/A"
      }, State: ${customer.billingState || "N/A"}, Zip: ${
        customer.billingZipcode || "N/A"
      }</p>
            </div>
          </div>
          <table class="invoice-details-table">
            <tr>
              <td>Invoice No</td>
              <td>PO Number</td>
              <td>Order Date</td>
              <td>Due Date</td>
              <td>Payment Status</td>
            </tr>
            <tr>
              <td><b>${order.invoiceNumber || "N/A"}</b></td>
              <td><b>${order.PONumber || "N/A"}</b></td>
              <td><b>${order.date || "N/A"}</b></td>
              <td><b>${order.paymentDueDate || "N/A"}</b></td>
              <td><b>${order.paymentStatus || "N/A"}</b></td>
            </tr>
          </table>
          <table class="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <table class="totals">
            <tr><td><strong>Subtotal:</strong></td><td>${(
              (order.orderAmount || 0) + (order.discountGiven || 0)
            ).toFixed(2)}</td></tr>
            <tr><td><strong>Discount:</strong></td><td>${(
              order.discountGiven || 0
            ).toFixed(2)}</td></tr>
            <tr><td><strong>Shipping Charge:</strong></td><td>${
              order.shippingCharge || 0
            }</td></tr>
            <tr><td><strong>Total:</strong></td><td>${(
              order.orderAmount || 0
            ).toFixed(2)}</td></tr>
            <tr><td><strong>Amount Paid:</strong></td><td>${(
              order.paymentAmountReceived || 0
            ).toFixed(2)}</td></tr>
            <tr><td><strong>Open Balance:</strong></td><td>${(
              order.openBalance || 0
            ).toFixed(2)}</td></tr>
            <tr><td><strong>Profit Amount:</strong></td><td>${(
              order.profitAmount || 0
            ).toFixed(2)}</td></tr>
            <tr><td><strong>Profit Percentage:</strong></td><td>${(
              order.profitPercentage || 0
            ).toFixed(2)}%</td></tr>
          </table>
        </div>
      `;
    })
    .join("");

  console.log("Generated order sections HTML length:", orderSections.length); // Debug: Log HTML length

  // Generate full HTML content with company info only at the top
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #333; margin: 0; padding: 10px; background-color: #fff; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; height: 100px; display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 20px; }
          .logo { width: 120px; margin-right: 10px; }
          .company-info { color: #555; font-size: 11px; }
          .contact-info { text-align: left; margin: 0 10px; }
          .invoice-title { background-color: #388E3C; color: #fff; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-left: 10px; margin-bottom: 55px; }
          .info-section { display: flex; justify-content: space-between; gap: 4px; margin: 20px 0; }
          .info-block { width: 48%; background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; border-radius: 4px; line-height: 1.2; }
          .info-block .label { font-weight: bold; color: #388E3C; }
          .product-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .product-table th { background-color: #388E3C; color: #fff; padding: 5px; font-size: 12px; text-align: center; border: 1px solid #ddd; }
          .product-table td { padding: 8px; border: 1px solid #ddd; font-size: 13px; }
          .totals-table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0; }
          .totals-table td { padding: 8px; border: 1px solid #ddd; }
          .totals-table .total-row { background-color: #E8F5E9; }
          .totals-table .label { font-weight: bold; text-align: left; }
          .totals-table .value { text-align: right; }
          .footer { text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #ddd; }
          .invoice-details-table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 4px; }
          .invoice-details-table td { padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; }
          .customer-table { margin-top: 30px; }
          .order-section { margin-bottom: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
              <div class="invoice-title">All Orders Report</div>
            </div>
            <div class="contact-info">
              <p class="company-info">Arbora Products</p>
              <p class="company-info">11311 Harry Hines Blvd. Suite 514\nDallas TX 75229, USA</p>
              <p class="company-info">Email: sales@arboraproducts.com</p>
              <p class="company-info">https://arboraproducts.com</p>
              <p class="company-info">📞 972-901-9944</p>
            </div>
          </div>
          ${orderSections}
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} | Arbora Paper Products<br/>
            Thank you for choosing Arbora for your paper product needs!
          </div>
        </div>
      </body>
    </html>
  `;
  console.log("Generated full HTML content length:", htmlContent.length); // Debug: Log full HTML length

  // Generate PDF using the utility function
  console.log("Generating PDF from HTML content"); // Debug: Start of PDF generation
  const pdfBuffer = await generatePdf(htmlContent);
  console.log("PDF generated successfully, buffer length:", pdfBuffer.length); // Debug: Confirm PDF generation

  return pdfBuffer;
};
export const OrderServices = {
  createOrderIntoDB,
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  updateOrderIntoDB,
  deleteOrderIntoDB,
  generateOrderInvoicePdf,
  getProductsGroupedByCategory,
  getBestSellingProducts,
  getWorstSellingProducts,
  getProductSegmentation,
  getChartData,
  generateAllOrdersPdf,
  generateDeliverySheetPdf,
  getOrdersByPONumber,
  generateShipToAddressPdf,
};

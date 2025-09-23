import * as XLSX from "xlsx";
import { Response } from "express";
import { ICustomer } from "../modules/customer/customer.interface";
import { IOrder } from "../modules/order/order.interface";
import { CustomerModel } from "../modules/customer/customer.model";
import { ProductModel } from "../modules/product/product.model";

export const exportGroupedProductsToExcel = (
  groupedData: any[],
  res: Response
) => {
  const worksheetData: any[][] = [];

  // Fill the first 3 rows and first column as empty placeholders
  for (let i = 0; i < 1; i++) {
    const row: any[] = new Array(6).fill("");
    worksheetData.push(row);
  }

  groupedData.forEach((group) => {
    worksheetData.push(["", group.category.name]);

    worksheetData.push([
      "",
      "Item No",
      "Item Name",
      "Package Size",
      "Sale Price",
      "Order Quantity",
    ]);

    group.products.forEach((product: any) => {
      worksheetData.push([
        "",
        product.itemNumber,
        product.name,
        product.packetSize,
        product.salesPrice != null ? `$${product.salesPrice}` : "",
        product.orderQuantity || "",
      ]);
    });

    worksheetData.push([""]); // Empty row between groups
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Initialize merges array
  worksheet["!merges"] = [];

  // Style customization
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  const blackCellStyle = {
    fill: {
      fgColor: { rgb: "000000" },
    },
  };

  const boldStyle = {
    font: {
      bold: true,
    },
  };

  const borderedStyle = {
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = worksheet[cellRef];

      // Initialize cell style if it doesn't exist
      if (!cell) {
        cell = { v: worksheetData[R]?.[C] || "" };
        worksheet[cellRef] = cell;
      }
      if (!cell.s) cell.s = {};

      // Fill first 3 rows and first column with black
      if (R < 3 || C === 0) {
        cell.s = { ...cell.s, ...blackCellStyle };
      }

      // Bold category row and merge with next cell
      if (R >= 3 && worksheetData[R][1] && !worksheetData[R][2]) {
        cell.s = { ...cell.s, ...boldStyle };
        // Merge category cell with the next cell to the right
        worksheet["!merges"]!.push({
          s: { r: R, c: 1 }, // Start at column 1 (category name)
          e: { r: R, c: 2 }, // End at column 2 (next cell)
        });
      }

      // Bold header row
      if (
        worksheetData[R][1] === "Item No" &&
        worksheetData[R][2] === "Item Name"
      ) {
        cell.s = { ...cell.s, ...boldStyle };
      }

      // Add border and align sale price column left for data rows
      if (R >= 3 && C >= 1 && worksheetData[R][1]) {
        cell.s = {
          ...cell.s,
          ...borderedStyle,
          ...(C === 4 ? { alignment: { horizontal: "left" } } : {}),
        };
      }
    }
  }

  // Column widths
  worksheet["!cols"] = [
    { wch: 2 },
    { wch: 20 },
    { wch: 40 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
  ];

  // Row height increase for category headings
  worksheet["!rows"] = worksheetData.map((row) => {
    if (row[1] && !row[2]) {
      return { hpt: 25 };
    }
    return {};
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Products");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    cellStyles: true,
  });

  res.setHeader("Content-Disposition", "attachment; filename=products.xlsx");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};


export const exportCustomersToExcel = (customerData: ICustomer[], res: Response) => {
  const worksheetData: any[][] = [];

  // Add 1st row with header
  worksheetData.push([
    "Store Name",
    "Store Phone",
    "Store Person Email",
    "Sales Tax ID",
    "Accepted Delivery Days",
    "Bank ACH Account Info",
    "Store Person Name",
    "Store Person Phone",
    "Billing Address",
    "Billing State",
    "Billing Zipcode",
    "Billing City",
    "Is Prospect",
    "Shipping Address",
    "Shipping State",
    "Shipping Zipcode",
    "Shipping City",
    "Notes",
  ]);

  // Add 2nd row as empty
  worksheetData.push(new Array(18).fill("")); // 18 columns based on updated header length

  // Add customer data starting from 3rd row
  customerData.forEach((customer: ICustomer) => {
    worksheetData.push([
      customer.storeName,
      customer.storePhone,
      customer.storePersonEmail,
      customer.salesTaxId,
      customer?.acceptedDeliveryDays?.join(", "),
      customer.bankACHAccountInfo,
      customer.storePersonName,
      customer.storePersonPhone,
      customer.billingAddress,
      customer.billingState,
      customer.billingZipcode,
      customer.billingCity,
      customer.isCustomerSourceProspect ? "Yes" : "No",
      customer.shippingAddress,
      customer.shippingState,
      customer.shippingZipcode,
      customer.shippingCity,
      customer.note || "",
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Style customization
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  const boldStyle = {
    font: {
      bold: true,
    },
  };

  const borderedStyle = {
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = worksheet[cellRef];

      // Initialize cell style if it doesn't exist
      if (!cell) {
        cell = { v: worksheetData[R]?.[C] || "" };
        worksheet[cellRef] = cell;
      }
      if (!cell.s) cell.s = {};

      // Bold header row (1st row)
      if (R === 0) {
        cell.s = { ...cell.s, ...boldStyle };
      }

      // Add border to data rows (starting from 3rd row)
      if (R > 1) {
        cell.s = {
          ...cell.s,
          ...borderedStyle,
        };
      }
    }
  }

  // Column widths
  worksheet["!cols"] = [
    { wch: 35 }, // Store Name
    { wch: 15 }, // Store Phone
    { wch: 25 }, // Store Person Email
    { wch: 15 }, // Sales Tax ID
    { wch: 20 }, // Accepted Delivery Days
    { wch: 25 }, // Bank ACH Account Info
    { wch: 20 }, // Store Person Name
    { wch: 15 }, // Store Person Phone
    { wch: 30 }, // Billing Address
    { wch: 12 }, // Billing State
    { wch: 10 }, // Billing Zipcode
    { wch: 15 }, // Billing City
    { wch: 10 }, // Is Prospect
    { wch: 30 }, // Shipping Address
    { wch: 12 }, // Shipping State
    { wch: 10 }, // Shipping Zipcode
    { wch: 15 }, // Shipping City
    { wch: 40 }, // Notes
  ];

  // Row height increase for header and empty row
  worksheet["!rows"] = worksheetData.map((row, index) => {
    if (index === 0) { // Header row
      return { hpt: 25 };
    } else if (index === 1) { // Empty 2nd row
      return { hpt: 10 }; // Slightly taller for visibility
    }
    return {};
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Customers");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    cellStyles: true,
  });

  res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};


export const exportOrdersToExcel = async (orderData: IOrder[], res: Response) => {
  const worksheetData: any[][] = [];

  // Add 1st row with header
  worksheetData.push([
    "PO Number",
    "Date",
    "Invoice Number",
    "Store Name",
    "Payment Due Date",
    "Order Amount",
    "Shipping Charge",
    "Discount Given",
    "Open Balance",
    "Profit Amount",
    "Profit Percentage",
    "Payment Amount Received",
    "Shipping Date",
    "Total Payable",
    "Order Status",
    "Payment Status",
    "Delivery Doc",
    "Products",
    "Credit Amount",
    "Last Credit Date",
  ]);

  // Add 2nd row as empty
  worksheetData.push(new Array(20).fill("")); // 20 columns based on updated header length

  // Add order data starting from 3rd row
  for (const order of orderData) {
    // Fetch Store Name
    const store = await CustomerModel.findOne({ _id: order.storeId });
    const storeName = store ? store.storeName : "N/A";

    // Prepare products string with itemNumbers
    const productsWithItemNumbers = await Promise.all(
      order.products.map(async (p) => {
        const product = await ProductModel.findOne({ _id: p.productId });
        const itemNumber = product ? product.itemNumber : "N/A";
        return `${itemNumber}: Qty ${p.quantity}, Price $${p.price}, Disc $${p.discount}`;
      })
    );
    const productsString = productsWithItemNumbers.join("; ");

    worksheetData.push([
      order.PONumber,
      order.date,
      order.invoiceNumber,
      storeName,
      order.paymentDueDate,
      order.orderAmount !== undefined && order.orderAmount !== null ? order.orderAmount : "N/A",
      order.shippingCharge !== undefined && order.shippingCharge !== null ? order.shippingCharge : "N/A",
      order.discountGiven !== undefined && order.discountGiven !== null ? order.discountGiven : "N/A",
      order.openBalance !== undefined && order.openBalance !== null ? order.openBalance : "N/A",
      order.profitAmount !== undefined && order.profitAmount !== null ? order.profitAmount : "N/A",
      order.profitPercentage !== undefined && order.profitPercentage !== null ? order.profitPercentage : "N/A",
      order.paymentAmountReceived !== undefined && order.paymentAmountReceived !== null ? order.paymentAmountReceived : "N/A",
      order.shippingDate || "",
      order.totalPayable !== undefined && order.totalPayable !== null ? order.totalPayable : "N/A",
      order.orderStatus,
      order.paymentStatus,
      order.deliveryDoc || "",
      productsString,
      order.creditInfo?.amount !== undefined && order.creditInfo?.amount !== null ? order.creditInfo.amount : "N/A",
      order.creditInfo?.date || "",
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Style customization
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  const boldStyle = {
    font: {
      bold: true,
    },
  };

  const borderedStyle = {
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = worksheet[cellRef];

      // Initialize cell style if it doesn't exist
      if (!cell) {
        cell = { v: worksheetData[R]?.[C] || "" };
        worksheet[cellRef] = cell;
      }
      if (!cell.s) cell.s = {};

      // Bold header row (1st row)
      if (R === 0) {
        cell.s = { ...cell.s, ...boldStyle };
      }

      // Add border to data rows (starting from 3rd row)
      if (R > 1) {
        cell.s = {
          ...cell.s,
          ...borderedStyle,
        };
      }
    }
  }

  // Column widths
  worksheet["!cols"] = [
    { wch: 20 }, // PO Number
    { wch: 15 }, // Date
    { wch: 20 }, // Invoice Number
    { wch: 25 }, // Store Name
    { wch: 15 }, // Payment Due Date
    { wch: 15 }, // Order Amount
    { wch: 15 }, // Shipping Charge
    { wch: 15 }, // Discount Given
    { wch: 15 }, // Open Balance
    { wch: 15 }, // Profit Amount
    { wch: 15 }, // Profit Percentage
    { wch: 20 }, // Payment Amount Received
    { wch: 15 }, // Shipping Date
    { wch: 15 }, // Total Payable
    { wch: 15 }, // Order Status
    { wch: 15 }, // Payment Status
    { wch: 30 }, // Delivery Doc
    { wch: 40 }, // Products
    { wch: 15 }, // Credit Amount
    { wch: 15 }, // Last Credit Date
  ];

  // Row height increase for header and empty row
  worksheet["!rows"] = worksheetData.map((row, index) => {
    if (index === 0) { // Header row
      return { hpt: 25 };
    } else if (index === 1) { // Empty 2nd row
      return { hpt: 10 }; // Slightly taller for visibility
    }
    return {};
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    cellStyles: true,
  });

  res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};
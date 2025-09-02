import * as XLSX from "xlsx";
import { Response } from "express";

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

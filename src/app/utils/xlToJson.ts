
import XLSX from 'xlsx';
import { Types } from 'mongoose';
import { ProductModel } from '../modules/product/product.model';

// Interface for xlToJson output to match IContainer.containerProducts
interface IContainerProduct {
  category: string;
  itemNumber: string;
  packetSize: string; // Changed to string
  quantity: number;
  purchasePrice: number;
  salesPrice: number;
}

export interface IContainer {
  _id?: Types.ObjectId;
  containerNumber?: string;
  containerName: string;
  containerStatus: 'arrived' | 'onTheWay';
  deliveryDate: string;
  containerProducts: {
    category: string;
    itemNumber: string;
    packetSize: string; // Changed to string
    quantity: number;
    purchasePrice: number;
    salesPrice: number;
    perCaseCost: number;
    perCaseShippingCost: number;
  }[];
  shippingCost?: number;
  isDeleted: boolean;
}

/**
 * Converts an XLSX buffer to clean JSON, including salesPrice from the database and packetSize as a string.
 * 
 * @param fileBuffer - Buffer of the XLSX file.
 * @param sheetNameOptional - Optional sheet name.
 * @returns Cleaned JSON array of product rows with salesPrice from ProductModel and packetSize as string.
 */
export const xlToJson = async (
  fileBuffer: Buffer,
  sheetNameOptional?: string
): Promise<IContainerProduct[]> => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = sheetNameOptional || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  console.log('Raw JSON from XLSX:', JSON.stringify(rawJson, null, 2));

  const cleaned = await Promise.all(
    rawJson
      .filter((row: any) => 
        row['Item Number']?.toString().trim() || 
        row['Item Name']?.toString().trim()
      )
      .map(async (row: any) => {
        // Fetch salesPrice from ProductModel
        let salesPrice: number | null = null;
        try {
          const product = await ProductModel.findOne({ 
            itemNumber: row['Item Number']?.toString().trim() 
          }).select('salesPrice').lean();
          
          if (product && typeof product.salesPrice === 'number') {
            salesPrice = product.salesPrice;
          } else {
            console.warn(`No product found for Item Number: ${row['Item Number']} or salesPrice is missing`);
          }
        } catch (error) {
          console.error(`Error fetching product for Item Number: ${row['Item Number']}`, error);
        }

        // Keep packetSize as string
        const packetSize = row['Packet Size']?.toString().trim() || '';
        if (!packetSize) {
          console.warn(`Missing packetSize for Item Number: ${row['Item Number']}, using empty string`);
        }

        // Convert quantity and purchasePrice to numbers
        const quantity = typeof row['Quantity'] === 'string' && row['Quantity'].trim() 
          ? Number(row['Quantity']) 
          : (typeof row['Quantity'] === 'number' ? row['Quantity'] : 0);
        const purchasePrice = typeof row['Purchase Price'] === 'string' && row['Purchase Price'].trim() 
          ? Number(row['Purchase Price']) 
          : (typeof row['Purchase Price'] === 'number' ? row['Purchase Price'] : 0);

        return {
          category: row['Category']?.toString().trim() || '',
          itemNumber: row['Item Number']?.toString().trim() || '',
          itemName: row['Item Name']?.toString().trim() || '',
          packetSize, // Stored as string
          quantity: isNaN(quantity) || quantity <= 0 ? 0 : quantity,
          purchasePrice: isNaN(purchasePrice) || purchasePrice < 0 ? 0 : purchasePrice,
          salesPrice: salesPrice !== null ? salesPrice : 0,
        };
      })
  );

  console.log('Cleaned JSON:', JSON.stringify(cleaned, null, 2));
  return cleaned;
};


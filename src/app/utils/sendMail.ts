import nodemailer from "nodemailer";
import config from "../config";
import * as fs from "node:fs/promises";
import { Types } from "mongoose";
import { ProductModel } from "../modules/product/product.model";

export const sendMail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: config.smtp_host || "smtp.hostinger.com", // Hostinger SMTP host
    port: config.smtp_port ? Number(config.smtp_port) : 465, // Usually 465 for SSL or 587 for TLS
    secure: true, // true for port 465, false for 587
    auth: {
      user: config.email_user, // Your full Hostinger email address
      pass: config.email_password, // Your Hostinger email password
    },
  });

  const mailOptions = {
    from: `"Arbora" <${config.email_user}>`,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendResetPasswordOTP = async (email: string, otp: string) => {
  const subject = "Your Password Reset OTP";
  const text = `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Reset</h2>
      <p>Your OTP is:</p>
      <h3>${otp}</h3>
      <p>This OTP will expire in <b>10 minutes</b>.</p>
    </div>
  `;
  console.log("3. sendResetPasswordOTP running ..");
  await sendMail({ to: email, subject, text, html });
};

export const sendProspectDutyEmailToSalesPerson = async (
  salesEmail: string,
  prospectId: string,
  prospectStoreName: string
) => {
  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png

  const subject = "📌 New Prospect Assigned to You";

  const prospectLink = `https://your-frontend-domain.com/prospects/${prospectId}`;

  const text = `You have been assigned a new prospect: ${prospectStoreName}. Please log in to your dashboard to view and follow up with this prospect.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
            <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
      </div>
      <h2 style="color: #4CAF50; text-align: center;">New Prospect Assigned 🎯</h2>
      <p style="font-size: 16px; color: #333;">
        Hello,
      </p>
      <p style="font-size: 16px; color: #333;">
        You have been assigned to follow up with a new prospect:
      </p>
      <p style="font-size: 18px; font-weight: bold; color: #000;">
        ${prospectStoreName}
      </p>
      <p style="font-size: 16px; color: #333;">
        Please log in to your Arbora Sales Dashboard to review the details and take the necessary next steps.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${prospectLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
          View Prospect
        </a>
      </div>
      <p style="font-size: 14px; color: #777; text-align: center;">
        Thank you for staying proactive in growing our customer relationships.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">
        - Arbora Team
      </p>
    </div>
  `;

  await sendMail({ to: salesEmail, subject, text, html });
};

export const sendQuoteEmailToCustomer = async ({
  storePersonEmail,
  quoteList,
  noteText,
}: {
  storePersonEmail: string;
  quoteList: { productName: string; quotePrice: number }[];
  noteText: string;
}) => {
  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png

  const subject = "Special call up from Arbora";
  const totalQuoteAmount = quoteList
    .reduce((sum, item) => sum + item.quotePrice, 0)
    .toFixed(2);

  const quoteDetails = quoteList
    .map(
      (item) => `
      <li>
        ${item.productName} - Quote Price: $${item.quotePrice.toFixed(2)}
      </li>
    `
    )
    .join("");

  const text = `Dear Customer,

We are pleased to provide you with the following product price quote:

${quoteList
  .map((item) => `${item.productName}: $${item.quotePrice.toFixed(2)}`)
  .join("\n")}

Total Quote Amount: $${totalQuoteAmount}

Note: ${noteText}

Please let us know if you have any questions or would like to proceed with this quote. Contact us at sales@arboraproducts.com for further assistance.

Best regards,
Arbora Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
      </div>
      <h2 style="color: #4CAF50; text-align: center;">Product Price Quote 📦</h2>
      <p style="font-size: 16px; color: #333;">
        Dear Customer,
      </p>
      <p style="font-size: 16px; color: #333;">
        We are pleased to provide you with the following product price quote:
      </p>
      <ul style="font-size: 16px; color: #333; padding-left: 20px;">
        ${quoteDetails}
      </ul>
      <p style="font-size: 16px; color: #333;">
        Total Quote Amount: <b>$${totalQuoteAmount}</b>
      </p>
      <p style="font-size: 16px; color: #333;">
        Note: ${noteText}
      </p>
      <p style="font-size: 16px; color: #333;">
        Please let us know if you have any questions or would like to proceed with this quote. Should you need further assistance, feel free to contact us at <a href="mailto:sales@arboraproducts.com">sales@arboraproducts.com</a>.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
        Thank you for choosing Arbora.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">
        - Arbora Team
      </p>
    </div>
  `;

  await sendMail({ to: storePersonEmail, subject, text, html });
};

export const sendEarlyPaymentDueEmail = async ({
  storePersonEmail,
  unpaidOrders,
  customerName,
}: {
  storePersonEmail: string;
  unpaidOrders: any[];
  customerName: string;
}) => {
  console.log("email sending to customer.... ", storePersonEmail);

  // Use online-hosted images
  const logoDataUrl = "https://i.ibb.co/spjM17CL/logo.png";
  const paymentOptionPic1DataUrl =
    "https://i.ibb.co/qMWKdrYB/payment-Option-Pic1.png";
  const paymentOptionPic2DataUrl =
    "https://i.ibb.co/84DPxKzH/payment-Option-Pic2.png";

  // Assume ProductModel is your Mongoose model for IProduct
  const getProductName = async (productId: string) => {
    try {
      const product = await ProductModel.findOne({
        _id: new Types.ObjectId(productId),
        isDeleted: false,
      });
      return product?.name || "Unknown Product";
    } catch (error) {
      console.error(
        "Error fetching product name for productId:",
        productId,
        error
      );
      return "Unknown Product";
    }
  };

  // Process each unpaid order (assuming one email per customer with all relevant orders)
  for (const order of unpaidOrders) {
    const invoiceNumber = order.invoiceNumber;
    const orderDate = new Date(order.date).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const poNumber = order.PONumber;
    const paymentDueDate = new Date(order.paymentDueDate).toLocaleDateString(
      "en-US",
      { month: "2-digit", day: "2-digit", year: "numeric" }
    );
    const totalPayable = order.totalPayable.toFixed(2);
    const paymentAmountReceived = order.paymentAmountReceived.toFixed(2);
    const openBalance = order.openBalance.toFixed(2);
    const discountGiven = order.discountGiven.toFixed(2);

    // Fetch product details asynchronously
    const productDetailsPromises = order.products.map(async (product: any) => {
      const productName = await getProductName(product.productId);
      return `<li>${productName} - Quantity: ${product.quantity}</li>`;
    });
    const productDetails = (await Promise.all(productDetailsPromises)).join("");

    const subject = `Friendly Reminder – Invoice ${invoiceNumber} Due in 5 Days`;

    const text = `Dear ${customerName},

I hope you’re doing well.
Thank you for trusting us as your food distribution partner; we truly appreciate your continued support.
This is a friendly reminder that Invoice ${invoiceNumber}, dated ${orderDate}, with PO# ${poNumber}, for a total payable of $${totalPayable}, has an open balance of $${openBalance} (Payment Received: $${paymentAmountReceived}, Discount Given: $${discountGiven}), due on ${paymentDueDate} just 5 days from today. The invoice is attached for your reference.

Product Details:
${(
  await Promise.all(
    order.products.map(async (product: any) => {
      const productName = await getProductName(product.productId);
      return `  - ${productName}: Quantity ${product.quantity}`;
    })
  )
).join("\n")}

If you’ve already arranged payment, please disregard this message. Otherwise, we kindly ask that the payment be completed by the due date to avoid any disruption in service.
Should you have any questions or need clarification, feel free to reach out. We’re happy to assist.

Payment Options:
1. Make Check Payable to Veda Global LLC or Arbora Products:
   Mail to: 11311 Harry Hines Blvd, Suite 514 Dallas, TX 75229
2. Zelle: sales@arboraproducts.com
3. Credit Card Payment: please add 3.5% convenience charge

Thank you again for your valued partnership.
Warm regards,
Accounting Team
972-901-9944
11311 Harry Hines Blvd, Suite 514
Dallas, TX 75229
sales@arboraproducts.com`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" style="width: 168px;" />
        </div>
        <h2 style="color: #4CAF50; text-align: center;">Friendly Reminder 📩</h2>
        <p style="font-size: 16px; color: #333;">
          Dear ${customerName},
        </p>
        <p style="font-size: 16px; color: #333;">
          I hope you’re doing well.
        </p>
        <p style="font-size: 16px; color: #333;">
          Thank you for trusting us as your food distribution partner; we truly appreciate your continued support.
        </p>
        <p style="font-size: 16px; color: #333;">
          This is a friendly reminder that Invoice <b>${invoiceNumber}</b>, dated <b>${orderDate}</b>, with PO# <b>${poNumber}</b>, for a total payable of <b>$${totalPayable}</b>, has an open balance of <b>$${openBalance}</b>, due on <b>${paymentDueDate}</b> just 5 days from today. The invoice is attached for your reference.
        </p>
        <p style="font-size: 16px; color: #333;">
          Product Details:
        </p>
        <ul style="font-size: 16px; color: #333; padding-left: 20px;">
          ${productDetails}
        </ul>
        <p style="font-size: 16px; color: #333;">
          If you’ve already arranged payment, please disregard this message. Otherwise, we kindly ask that the payment be completed by the due date to avoid any disruption in service.
        </p>
        <p style="font-size: 16px; color: #333;">
          Should you have any questions or need clarification, feel free to reach out. We’re happy to assist.
        </p>
        <p style="font-size: 16px; color: #333; font-weight: bold;">Payment Options:</p>
        <ol style="font-size: 16px; color: #333; padding-left: 20px;">
          <li>
            Make Check Payable to Veda Global LLC or Arbora Products:
            <br />Mail to: 11311 Harry Hines Blvd, Suite 514 Dallas, TX 75229
          </li>
          <li>
            Zelle: <a href="mailto:sales@arboraproducts.com">sales@arboraproducts.com</a>
            <br /><img src="${paymentOptionPic1DataUrl}" alt="Payment Option 1" style="width: 200px; margin-top: 10px;" />
          </li>
          <li>
            Credit Card Payment: please add 3.5% convenience charge
            <br /><img src="${paymentOptionPic2DataUrl}" alt="Payment Option 2" style="width: 200px; margin-top: 10px;" />
          </li>
        </ol>
        <p style="font-size: 16px; color: #333;">
          Thank you again for your valued partnership.
        </p>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
          Warm regards,
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          Accounting Team
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          972-901-9944
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          11311 Harry Hines Blvd, Suite 514
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          Dallas, TX 75229
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          <a href="mailto:sales@arboraproducts.com">sales@arboraproducts.com</a>
        </p>
      </div>
    `;

    await sendMail({ to: storePersonEmail, subject, text, html });
    console.log("Email sent successfully for invoice:", invoiceNumber);
  }
};

export const sendCurrentDayPaymentDueEmail = async ({
  storePersonEmail,
  unpaidOrders,
  customerName,
}: {
  storePersonEmail: string;
  unpaidOrders: any[];
  customerName: string;
}) => {
  console.log("email sending to customer.... ", storePersonEmail);

  // Use online-hosted images
  const logoDataUrl = "https://i.ibb.co/spjM17CL/logo.png";
  const paymentOptionPic1DataUrl =
    "https://i.ibb.co/qMWKdrYB/payment-Option-Pic1.png";
  const paymentOptionPic2DataUrl =
    "https://i.ibb.co/84DPxKzH/payment-Option-Pic2.png";

  // Assume ProductModel is your Mongoose model for IProduct
  const getProductName = async (productId: string) => {
    try {
      const product = await ProductModel.findOne({
        _id: new Types.ObjectId(productId),
        isDeleted: false,
      });
      return product?.name || "Unknown Product";
    } catch (error) {
      console.error(
        "Error fetching product name for productId:",
        productId,
        error
      );
      return "Unknown Product";
    }
  };

  // Process each unpaid order (assuming one email per customer with all relevant orders)
  for (const order of unpaidOrders) {
    const invoiceNumber = order.invoiceNumber;
    const orderDate = new Date(order.date).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const poNumber = order.PONumber;
    const paymentDueDate = new Date(order.paymentDueDate).toLocaleDateString(
      "en-US",
      { month: "2-digit", day: "2-digit", year: "numeric" }
    );
    const totalPayable = order.totalPayable.toFixed(2);
    const paymentAmountReceived = order.paymentAmountReceived.toFixed(2);
    const openBalance = order.openBalance.toFixed(2);
    const discountGiven = order.discountGiven.toFixed(2);
    const reminderNumber = order.reminderNumber || 0; // Default to 0 if undefined

    // Fetch product details asynchronously
    const productDetailsPromises = order.products.map(async (product: any) => {
      const productName = await getProductName(product.productId);
      return `<li>${productName} - Quantity: ${product.quantity}</li>`;
    });
    const productDetails = (await Promise.all(productDetailsPromises)).join("");

    const subject = `Invoice Payment Due Now`;

    const text = `Dear ${customerName},

I hope this message finds you well. This is a friendly reminder that Invoice ${invoiceNumber}, dated ${orderDate}, with PO# ${poNumber}, in the amount of $${totalPayable}, has an open balance of $${openBalance} (Payment Received: $${paymentAmountReceived}, Discount Given: $${discountGiven}), is now due.

${
  reminderNumber > 0
    ? `Reminder number: ${reminderNumber}\nPlease note that we have attempted to contact you regarding this overdue payment.`
    : ""
}

Please arrange payment at your earliest convenience to avoid any service interruptions. Payment can be made via Check, Zelle, Credit Card, or ACH. If you have already sent the payment, kindly disregard this notice.
Should you have any questions or require a copy of the invoice, please don’t hesitate to contact me directly.

Product Details:
${(
  await Promise.all(
    order.products.map(async (product: any) => {
      const productName = await getProductName(product.productId);
      return `  - ${productName}: Quantity ${product.quantity}`;
    })
  )
).join("\n")}

Payment Options:
1. Make Check Payable to Veda Global LLC or Arbora Products:
   Mail to: 11311 Harry Hines Blvd, Suite 514 Dallas, TX 75229
2. Zelle: sales@arboraproducts.com
3. Credit Card Payment: please add 3.5% convenience charge

Thank you again for your valued partnership.
Warm regards,
Accounting Team
972-901-9944
11311 Harry Hines Blvd, Suite 514
Dallas, TX 75229
sales@arboraproducts.com`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" style="width: 168px;" />
        </div>
        <h2 style="color: #4CAF50; text-align: center;">Invoice Payment Due Now 📩</h2>
        <p style="font-size: 16px; color: #333;">
          Dear ${customerName},
        </p>
        <p style="font-size: 16px; color: #333;">
          I hope this message finds you well.
        </p>
        <p style="font-size: 16px; color: #333;">
          This is a friendly reminder that Invoice <b>${invoiceNumber}</b>, dated <b>${orderDate}</b>, with PO# <b>${poNumber}</b>, in the amount of <b>$${totalPayable}</b>, has an open balance of <b>$${openBalance}</b> (Payment Received: <b>$${paymentAmountReceived}</b>, Discount Given: <b>$${discountGiven}</b>), is now due.
        </p>
        ${
          reminderNumber > 0
            ? `<h3 style="font-size: 18px; color: #d32f2f; text-align: center;">Reminder number: ${reminderNumber}</h3><p style="font-size: 16px; color: #333;">Please note that we have attempted to contact you regarding this overdue payment.</p>`
            : ""
        }
        <p style="font-size: 16px; color: #333;">
          Please arrange payment at your earliest convenience to avoid any service interruptions. Payment can be made via Check, Zelle, Credit Card, or ACH. If you have already sent the payment, kindly disregard this notice.
        </p>
        <p style="font-size: 16px; color: #333;">
          Should you have any questions or require a copy of the invoice, please don’t hesitate to contact me directly.
        </p>
        <p style="font-size: 16px; color: #333;">
          Product Details:
        </p>
        <ul style="font-size: 16px; color: #333; padding-left: 20px;">
          ${productDetails}
        </ul>
        <p style="font-size: 16px; color: #333; font-weight: bold;">Payment Options:</p>
        <ol style="font-size: 16px; color: #333; padding-left: 20px;">
          <li>
            Make Check Payable to Veda Global LLC or Arbora Products:
            <br />Mail to: 11311 Harry Hines Blvd, Suite 514 Dallas, TX 75229
          </li>
          <li>
            Zelle: <a href="mailto:sales@arboraproducts.com">sales@arboraproducts.com</a>
            <br /><img src="${paymentOptionPic1DataUrl}" alt="Payment Option 1" style="width: 200px; margin-top: 10px;" />
          </li>
          <li>
            Credit Card Payment: please add 3.5% convenience charge
            <br /><img src="${paymentOptionPic2DataUrl}" alt="Payment Option 2" style="width: 200px; margin-top: 10px;" />
          </li>
        </ol>
        <p style="font-size: 16px; color: #333;">
          Thank you again for your valued partnership.
        </p>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
          Warm regards,
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          Accounting Team
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          972-901-9944
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          11311 Harry Hines Blvd, Suite 514
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          Dallas, TX 75229
        </p>
        <p style="font-size: 14px; color: #777; text-align: center;">
          <a href="mailto:sales@arboraproducts.com">sales@arboraproducts.com</a>
        </p>
      </div>
    `;

    await sendMail({ to: storePersonEmail, subject, text, html });
    console.log("Email sent successfully for invoice:", invoiceNumber);
  }
};

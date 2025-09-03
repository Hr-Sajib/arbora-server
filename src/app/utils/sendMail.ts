import nodemailer from "nodemailer";
import config from "../config";
import * as fs from "node:fs/promises";

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

export const sendOpenBalanceEmail = async ({
  storePersonEmail,
  unpaidOrders,
  customerName
}: {
  storePersonEmail: string;
  unpaidOrders: any[];
  customerName: string
}) => {
  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png"; // Adjust the relative path based on your project structure
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`; // Updated to PNG format since the file is logo.png

  const subject = "Friendly Reminder: Outstanding Balance on Your Orders";
  const totalOpenBalance = unpaidOrders
    .reduce((sum, order) => sum + order.openBalance, 0)
    .toFixed(2);

  const orderDetails = unpaidOrders
    .map(
      (order) => `
      <li>
        Invoice #${
          order.invoiceNumber
        } - Open Balance: $${order.openBalance.toFixed(2)} (Due: ${
        order.paymentDueDate
      })
      </li>
    `
    )
    .join("");

  const text = `Dear ${customerName},

We kindly remind you of an outstanding balance of $${totalOpenBalance} on your orders. Please find details below:

${unpaidOrders
  .map(
    (order) =>
      `Invoice #${order.invoiceNumber}: $${order.openBalance.toFixed(
        2
      )} (Due: ${order.paymentDueDate})`
  )
  .join("\n")}

Please settle the balance at your earliest convenience. Feel free to contact us at sales@arboraproducts.com for assistance.

Best regards,
Arbora Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
            <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" class="logo" />
      </div>
      <h2 style="color: #4CAF50; text-align: center;">Friendly Reminder 📩</h2>
      <p style="font-size: 16px; color: #333;">
        Dear ${customerName},
      </p>
      <p style="font-size: 16px; color: #333;">
        We hope this message finds you well. We would like to kindly remind you of an outstanding balance of <b>$${totalOpenBalance}</b> on your orders with Arbora.
      </p>
      <p style="font-size: 16px; color: #333;">
        Please review the details below:
      </p>
      <ul style="font-size: 16px; color: #333; padding-left: 20px;">
        ${orderDetails}
      </ul>
      <p style="font-size: 16px; color: #333;">
        We kindly request you to settle this balance at your earliest convenience. Should you have any questions or need assistance, please don’t hesitate to reach out to us at <a href="mailto:sales@arboraproducts.com">sales@arboraproducts.com</a>.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
        Thank you for your prompt attention to this matter.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">
        - Arbora Team
      </p>
    </div>
  `;

  await sendMail({ to: storePersonEmail, subject, text, html });
};


export const sendPaymentDueEmail = async ({
  storePersonEmail,
  unpaidOrders,
  customerName,
}: {
  storePersonEmail: string;
  unpaidOrders: any[];
  customerName: string;
}) => {

  console.log("email sending to customer.... ",storePersonEmail)
  // Read the logo image from the public folder as base64
  const logoPath = "public/images/logo.png";
  const logoBase64 = await fs.readFile(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  const subject = "Payment Due Reminder: Action Required";
  const totalOpenBalance = unpaidOrders
    .reduce((sum, order) => sum + order.openBalance, 0)
    .toFixed(2);

  const orderDetails = unpaidOrders
    .map(
      (order) => `
      <li>
        Invoice #${order.invoiceNumber} - Open Balance: $${order.openBalance.toFixed(2)} (Due: ${new Date(order.paymentDueDate).toLocaleDateString('en-GB')})
      </li>
    `
    )
    .join("");

  const text = `Dear ${customerName},

This is a reminder about an outstanding balance of $${totalOpenBalance} on your orders with Arbora. Details are below:

${unpaidOrders
  .map(
    (order) =>
      `Invoice #${order.invoiceNumber}: $${order.openBalance.toFixed(2)} (Due: ${new Date(order.paymentDueDate).toLocaleDateString('en-GB')})`
  )
  .join("\n")}

Please settle the balance by the due date. Contact us at sales@arboraproducts.com for assistance.

Best regards,
Arbora Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img style="margin-left: 10px" src="${logoDataUrl}" alt="Arbora Logo" style="width: 168px;" />
      </div>
      <h2 style="color: #4CAF50; text-align: center;">Payment Due Reminder 📩</h2>
      <p style="font-size: 16px; color: #333;">
        Dear ${customerName},
      </p>
      <p style="font-size: 16px; color: #333;">
        This is a reminder of an outstanding balance of <b>$${totalOpenBalance}</b> on your orders with Arbora, due within the next 5 days.
      </p>
      <p style="font-size: 16px; color: #333;">
        Please review the details below:
      </p>
      <ul style="font-size: 16px; color: #333; padding-left: 20px;">
        ${orderDetails}
      </ul>
      <p style="font-size: 16px; color: #333;">
        We kindly request you to settle this balance by the due date. For any questions or assistance, please contact us at <a href="mailto:sales@arboraproducts.com">sales@arboraproducts.com</a>.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
        Thank you for your prompt attention.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">
        - Arbora Team
      </p>
    </div>
  `;

  await sendMail({ to: storePersonEmail, subject, text, html });
};
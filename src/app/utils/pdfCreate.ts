import puppeteer from "puppeteer";

export const generatePdf = async (htmlContent: string): Promise<Buffer> => {
  console.log("Starting PDF generation process...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }).catch((err) => {
    console.error("Error launching Puppeteer browser:", err);
    throw new Error("Failed to launch browser for PDF generation");
  });
  console.log("Puppeteer browser launched successfully.");

  try {
    console.log("Creating new page...");
    const page = await browser.newPage().catch((err) => {
      console.error("Error creating new page:", err);
      throw new Error("Failed to create new page for PDF generation");
    });
    console.log("New page created successfully.");

    // Set the provided HTML content
    console.log("Setting HTML content...");
    await page.setContent(htmlContent, { waitUntil: "networkidle0" }).catch((err) => {
      console.error("Error setting HTML content:", err);
      throw new Error("Failed to set HTML content for PDF generation");
    });
    console.log("HTML content set successfully.");

    // Generate PDF
    console.log("Generating PDF buffer...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
    }).catch((err) => {
      console.error("Error generating PDF:", err);
      throw new Error("Failed to generate PDF buffer");
    });
    console.log("PDF buffer generated successfully.");

    return Buffer.from(pdfBuffer);
  } finally {
    console.log("Closing browser...");
    await browser.close().catch((err) => {
      console.error("Error closing browser:", err);
    });
    console.log("Browser closed.");
  }
};
import express from "express";
import auth from "../../middlewares/auth";
import { OrderControllers } from "./order.controller";

const router = express.Router();

// Create and update
router.post("/", auth("admin"), OrderControllers.createOrder);
router.post("/giveCredit", auth("admin"), OrderControllers.giveCreditToCustomer);
router.patch("/:id", auth("admin"), OrderControllers.updateOrder);

// Delete
router.delete("/:id", auth("admin"), OrderControllers.deleteOrder);

// Specific GET routes (put before generic /:id)
router.get("/allOrdersPdf", auth("admin"), OrderControllers.getAllOrdersPDF);
router.get("/all-orders-excel", auth("admin"), OrderControllers.generateXlforAllOrders);
router.get("/getChart", auth("admin"), OrderControllers.getChart);
router.get("/bulk-order-excel-empty", auth("admin"), OrderControllers.getProductsGroupedByCategory);
router.get("/best-selling", OrderControllers.getBestSellingProductsController);
router.get("/worst-selling", OrderControllers.getWorstSellingProductsController);
router.get("/getProductSegmentation", auth("admin"), OrderControllers.getProductSegmentationCtrl);
router.get("/orderInvoice/:id", auth("admin"), OrderControllers.getOrderInvoicePdf);
router.get("/deliverySheet/:id", auth("admin"), OrderControllers.getDeliverySheetPdf);
router.get("/:id/ship-to-address-pdf", OrderControllers.getShipToAddressPdf);
router.get("/by-po/:poNumber", auth("admin"), OrderControllers.getOrdersByPONumber);

// Generic GET route (last)
router.get("/", auth("admin"), OrderControllers.getAllOrders);
router.get("/:id", auth("admin"), OrderControllers.getSingleOrder);

export const OrderRoutes = router;

import express from "express";
import auth from "../../middlewares/auth";
import { OrderControllers } from "./order.controller";

const router = express.Router();

// POST routes
router.post("/", auth("admin"), OrderControllers.createOrder);
router.post("/giveCredit", auth("admin"), OrderControllers.giveCreditToCustomer);

// PATCH and DELETE
router.patch("/:id", auth("admin"), OrderControllers.updateOrder);
router.delete("/:id", auth("admin"), OrderControllers.deleteOrder);

// GET static routes first
router.get("/allOrdersPdf", auth("admin"), OrderControllers.getAllOrdersPDF);
router.get("/all-orders-excel", auth("admin"), OrderControllers.generateXlforAllOrders);
router.get("/getChart", auth("admin"), OrderControllers.getChart);
router.get("/bulk-order-excel-empty", auth("admin"), OrderControllers.getProductsGroupedByCategory);
router.get("/best-selling", OrderControllers.getBestSellingProductsController);
router.get("/worst-selling", OrderControllers.getWorstSellingProductsController);
router.get("/getProductSegmentation", auth("admin"), OrderControllers.getProductSegmentationCtrl);

// GET routes with params that are not simple _id
router.get("/orderInvoice/:id", auth("admin"), OrderControllers.getOrderInvoicePdf);
router.get("/deliverySheet/:id", auth("admin"), OrderControllers.getDeliverySheetPdf);
router.get("/:id/ship-to-address-pdf", OrderControllers.getShipToAddressPdf);
router.get("/by-po/:poNumber", auth("admin"), OrderControllers.getOrdersByPONumber);

// GET all orders (static, should be before generic /:id if necessary)
router.get("/", auth("admin"), OrderControllers.getAllOrders);

// Generic route **last**
router.get("/:id", auth("admin"), OrderControllers.getSingleOrder);

export const OrderRoutes = router;

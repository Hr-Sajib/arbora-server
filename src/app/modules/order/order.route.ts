import express from "express";
import auth from "../../middlewares/auth";
import { OrderControllers } from "./order.controller";

const router = express.Router();

router.post(
  "/",
  auth("admin"),
  OrderControllers.createOrder
);

router.get(
  "/allOrdersPdf",
  auth("admin"),
  OrderControllers.getAllOrdersPDF
);

router.get(
  "/",
  auth("admin"),
  OrderControllers.getAllOrders
);

router.get(
  "/getChart",
  auth("admin"),
  OrderControllers.getChart
);

router.get(
  "/orderInvoice/:id",
  auth("admin"),
  OrderControllers.getOrderInvoicePdf
);

router.get(
  "/deliverySheet/:id",
  auth("admin"),
  OrderControllers.getDeliverySheetPdf
);

// Get Products Grouped By Category
router.get(
  "/bulk-order-excel-empty",
    auth("admin"),
  OrderControllers.getProductsGroupedByCategory
);

// Best and worst selling product for dashboard
router.get("/best-selling", OrderControllers.getBestSellingProductsController);
router.get("/worst-selling", OrderControllers.getWorstSellingProductsController);

router.get(
  "/getProductSegmentation",
  auth("admin"),
  OrderControllers.getProductSegmentationCtrl
);

router.get(
  "/:id",
  auth("admin"),
  OrderControllers.getSingleOrder
);


router.get("/by-po/:poNumber",
    auth("admin"),
  OrderControllers.getOrdersByPONumber);

router.delete(
  "/:id",
  auth("admin"),
  OrderControllers.deleteOrder
);

router.patch(
  "/:id",
  auth("admin"),
  OrderControllers.updateOrder
);

router.get(
  "/:id/ship-to-address-pdf",
  // auth("admin"),
  OrderControllers.getShipToAddressPdf
);

export const OrderRoutes = router;
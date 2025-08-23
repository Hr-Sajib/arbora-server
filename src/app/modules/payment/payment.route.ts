import express from "express";
import auth from "../../middlewares/auth";
import { PaymentControllers } from "./payment.controller";
import { ProductController } from "../product/product.controller";

const router = express.Router();

router.post(
  "/",
  auth("admin"),
  PaymentControllers.createPayment
);

router.get("/all-products-pdf", ProductController.getAllProductsPdf);


router.get("/:customerId/customersPayments", 
  auth("admin"), 
 PaymentControllers.getCustomersPayments);
router.get("/", 
  auth("admin"), 
 PaymentControllers.getAllPayments);

router.get(
  "/:id",
  auth("admin"),
  PaymentControllers.getSinglePayment
);

router.delete("/:id", auth("admin"), PaymentControllers.deletePayment);

router.patch(
  "/:id",
  auth("admin"),
  PaymentControllers.updatePayment
);


export const PaymentRoutes = router;

import express from "express";
import auth from "../../middlewares/auth";
import { CustomerControllers } from "./customer.controller";

const router = express.Router();

router.post(
  "/",
  auth("admin"),
  CustomerControllers.createCustomer
);

router.get("/", 
  auth("admin"), 
  CustomerControllers.getAllCustomers);

router.get(
  "/all-customers-excel",
  auth("admin"),
  CustomerControllers.generateXlforAllCustomers
);

router.get(
  "/:id",
  auth("admin"),
  CustomerControllers.getSingleCustomer
);

router.delete("/:id", 
  auth("admin"), 
  CustomerControllers.deleteCustomer);

router.patch(
  "/:id",
  auth("admin"),
  CustomerControllers.updateCustomer
);


router.post(
  "/:id/send-email-for-not-paid-orders",
  auth("admin"),
  CustomerControllers.sendEmailForNotPaidOrders
);


router.get(
  "/:id/generate-pallet",
  auth("admin"),
  CustomerControllers.generatePallet
);


export const CustomerRoutes = router;

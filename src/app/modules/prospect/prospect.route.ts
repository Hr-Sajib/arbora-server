import { Router } from "express";
import { ProspectControllers } from "./prospect.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.get(
  "/",
  auth("admin", "salesUser"),
  ProspectControllers.getAllProspects
);

router.get("/:id", ProspectControllers.getSingleProspect);

router.post(
  "/",
  auth("admin", "salesUser"),
  ProspectControllers.createProspect
);

router.patch(
  "/:id",
  // validateRequest(productValidation.updateProductValidationSchema),
  auth("admin", "salesUser"),
  ProspectControllers.updateProspect
);

router.delete(
  "/:id",
  auth("admin", "salesUser"),
  ProspectControllers.deleteProspect
);

router.post(
  "/:id/make-customer",
  auth("admin", "salesUser"),
  ProspectControllers.makeCustomer
);

router.post(
  "/:prospectId/send-quote",
  // auth("admin", "salesUser"), 
  ProspectControllers.sendQuoteToProspect
);

export const ProspectRoutes = router;
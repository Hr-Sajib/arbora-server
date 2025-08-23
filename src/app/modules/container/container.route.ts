import express from "express";
import auth from "../../middlewares/auth";
import { ContainerControllers } from "./container.controller";
import upload from "../../utils/multer";

const router = express.Router();

router.post(
  "/",
  auth("admin"),
  ContainerControllers.createContainer
);

router.post(
  "/xl",
  upload.single('file'), // This is REQUIRED
  auth("admin"),
  ContainerControllers.xlImportToAddContainer
);

router.get("/", 
  auth("admin"), 
  ContainerControllers.getAllContainers);

router.get(
  "/:id",
  auth("admin"),
  ContainerControllers.getSingleContainer
);

router.delete("/:id", 
  auth("admin"), 
  ContainerControllers.deleteContainer);

router.patch(
  "/:id",
  auth("admin"),
  ContainerControllers.updateContainer
);


export const ContainerRoutes = router;

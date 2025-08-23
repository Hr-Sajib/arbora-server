import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { ProductController } from "./product.controller";
import { productValidation } from "./product.validation";
import auth from "../../middlewares/auth";

const router = Router();

router.get("/all-products-pdf", ProductController.getAllProductsPdf);

router.get(
  "/by-category/:categoryId",
  auth("admin"),
  ProductController.getProductsByCategory
);

router.get("/packet-sizes", auth("admin"), ProductController.getAllPacketSizes);

router.get("/", auth("admin"), ProductController.getAllProducts);

router.get("/productSoldTo/:id", auth("admin"), ProductController.getSoldTo);

router.get("/:id", auth("admin"), ProductController.getSingleProduct);

router.post(
  "/",
  auth("admin"),

  ProductController.createProduct
);

router.patch(
  "/:id",
  auth("admin"),

  validateRequest(productValidation.updateProductValidationSchema),
  ProductController.updateProduct
);

router.delete("/:id", auth("admin"), ProductController.deleteProduct);

export const ProductRoutes = router;

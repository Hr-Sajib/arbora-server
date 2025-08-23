import { Router } from "express";
import { CategoryController } from "./category.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.get("/",
    auth("admin"),
  CategoryController.getAllCategories);

router.get("/:id",
      auth("admin"),
 CategoryController.getCategoryById);

router.post(
  "/",
    auth("admin"),
  CategoryController.createCategory
);

router.patch(
  "/:id",
    auth("admin"),
  CategoryController.updateCategory
);

router.delete("/:id",
      auth("admin"),
 CategoryController.deleteCategory);

export const CategoryRoutes = router;

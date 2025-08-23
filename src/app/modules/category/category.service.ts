import status from "http-status";
import AppError from "../../errors/AppError";
import { ICategory } from "./category.interface";
import { CategoryModel } from "./category.model";
import { ProductModel } from "../product/product.model";
import mongoose from "mongoose";

// Insert category into database
const createCategoryIntoDB = async (payload: ICategory) => {
  const existingCategory = await CategoryModel.findOne({ name: payload.name });

  if (existingCategory) {
    throw new AppError(
      status.CONFLICT,
      "Category with this name already exists"
    );
  }

  const result = await CategoryModel.create(payload);
  return result;
};

// Get All Categories From DB
const getAllCategoriesFromDB = async () => {
  const categories = await CategoryModel.find().sort({ createdAt: -1 });
  return categories;
};

// Get Single Category From DB
const getSingleCategoryFromDB = async (categoryId: string) => {
  const category = await CategoryModel.findById(categoryId);

  if (!category) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  return category;
};

// Update a category in the database
const updateCategoryInDB = async (
  categoryId: string,
  payload: Partial<ICategory>
) => {
  const category = await CategoryModel.findById(categoryId);
  if (!category) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  return await CategoryModel.findByIdAndUpdate(categoryId, payload, {
    new: true,
  });
};

// Delete a category from the database
const deleteCategoryFromDB = async (id: string) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();

  try {
    // Begin transaction
    session.startTransaction();

    // Check if category exists
    const category = await CategoryModel.findById(id).session(session);
    if (!category) {
      throw new AppError(status.NOT_FOUND, "Category not found");
    }

    // Soft delete the category
    const updatedCategory = await CategoryModel.findByIdAndDelete(
      id,
      { new: true, session }
    );

    // Soft delete related products
    await ProductModel.updateMany(
      { categoryId: id},
      { $set: { isDeleted: true } },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    return updatedCategory;
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error instanceof AppError
      ? error
      : new AppError(status.INTERNAL_SERVER_ERROR, "Failed to delete category");
  } finally {
    // End session
    session.endSession();
  }
};

export const CategoryService = {
  createCategoryIntoDB,
  updateCategoryInDB,
  getAllCategoriesFromDB,
  getSingleCategoryFromDB,
  deleteCategoryFromDB,
};

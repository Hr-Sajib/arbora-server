import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { requestPasswordReset, resetPasswordWithOTP, UserServices } from "./user.service";
import { UserModel } from "./user.model";


const createUser = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const result = await UserServices.createUserIntoDB(body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User created successfully",
    data: result,
  });
});


const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsersFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserServices.getSingleUserFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Single user fetched successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;
  const updatePayload = req.body;

  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (user?.role !== "admin") {
    if (user?.email !== existingUser?.email) {
      throw new Error("You can not update other users information!");
    } else {
      const result = await UserServices.updateUserProfileIntoDB(id, updatePayload);

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User info updated successfully",
        data: result,
      });
    }
  } else {
    const result = await UserServices.updateUserProfileIntoDB(id, updatePayload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User updated successfully by Super Admin",
      data: result,
    });
  }
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserServices.deleteUserIntoDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User deleted successfully",
    data: result,
  });
});

// Change password controller
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;
  const { newPassword } = req.body;

  const updatedUser = await UserServices.changePassword(user, id, { newPassword });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password changed successfully",
    data: updatedUser,
  });
});



// Password Reset
export const sendResetOTP = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log("1. sendResetOTP controller running..")

  await requestPasswordReset(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP has been sent to your email",
    data: { email },
  });
});

export const handleResetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const updatedUser = await resetPasswordWithOTP(email, otp, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: updatedUser,
  });
});


export const UserControllers = {
  createUser,
  updateUser,
  getAllUsers,
  deleteUser,
  getSingleUser,
  changePassword,
};

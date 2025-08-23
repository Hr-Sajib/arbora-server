/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import bcrypt from "bcrypt";
import { IUser } from "./user.interface";
import { UserModel } from "./user.model";
import config from "../../config";
import { saveOTP, verifyOTP } from "../../utils/otpStore";
import { sendResetPasswordOTP } from "../../utils/sendMail";

const createUserIntoDB = async (payLoad: IUser) => {
  const { email } = payLoad;

  const checkExistingUser = await UserModel.findOne({ email });

  if (checkExistingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "This email is already in use!");
  }

  const userData = {
    firstName: payLoad.firstName,
    lastName: payLoad.lastName,
    image: payLoad.image,
    email: payLoad.email,
    role: payLoad.role,
    password: payLoad.password,
  };

  const createdUser = await UserModel.create(userData);

  return createdUser;
};

const getAllUsersFromDB = async () => {
  const result = await UserModel.find().select("-password");

  return result;
};

const getSingleUserFromDB = async (id: string) => {
  const result = await UserModel.findById(id);
  return result;
};

const updateUserProfileIntoDB = async (id: string, payload: any) => {
  const updateData = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    image: payload.image,
  };

  const updatedUser = await UserModel.findByIdAndUpdate(id, updateData).select(
    "-password"
  );

  return updatedUser;
};

// const changePassword = async (user:any, id: string, payload: any) => {

//   const existingUser = await UserModel.findById(id).select(
//     "+password"
//   );
//   if (!existingUser) {
//     throw new Error("User not found");
//   }

//   if (!payload.oldPassword || !payload.newPassword) {
//     throw new Error("Old password and new password are required");
//   }

//   if (user?.role == "admin") {
//     const hashedPassword = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));

//     const updatedUser = await UserModel.findByIdAndUpdate(
//       { id },
//       { $set: { password: hashedPassword } },
//       {
//         new: true,
//       }
//     ).select("+password");

//     return updatedUser;
//   } else {
//     const isOldPasswordCorrect = await bcrypt.compare(
//       payload.oldPassword,
//       existingUser.password
//     );

//     if (!isOldPasswordCorrect) {
//       throw new AppError(401, "Old password is incorrect");
//     }
//     const hashedPassword = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));

//     const updatedUser = await UserModel.findByIdAndUpdate(
//       id,
//       { password: hashedPassword },
//       {
//         new: true,
//       }
//     ).select("-password");

//     return updatedUser;
//   }
// };

const changePassword = async (
  user: any,
  id: string,
  payload: { newPassword: string }
) => {
  const existingUser = await UserModel.findById(id).select("+password");
  if (!existingUser) {
    throw new AppError(404, "User not found");
  }

  if (!payload.newPassword) {
    throw new AppError(400, "New password is required");
  }

  // const isSelf = user._id.toString() === id;
  const isAdmin = user?.role === "admin";

  // Authorization check
  // if (!isSelf && !isAdmin) {
  //   throw new AppError(403, "You are not authorized to change this user's password");
  // }
  if (!isAdmin) {
    throw new AppError(
      403,
      "You are not authorized to change this user's password"
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { password: hashedPassword },
    { new: true }
  ).select("-password");

  return updatedUser;
};

const deleteUserIntoDB = async (id: string) => {
  return UserModel.findByIdAndDelete(id);
};




// Password change
export const requestPasswordReset = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User with this email not found");

  console.log("2. requestPasswordReset running..")
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  saveOTP(email, otp);
  await sendResetPasswordOTP(email, otp);
};

export const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string) => {
  const isValid = verifyOTP(email, otp);
  if (!isValid) throw new Error("Invalid or expired OTP");

  const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
  await UserModel.findOneAndUpdate({ email }, { password: hashedPassword });
};

export const UserServices = {
  createUserIntoDB,
  updateUserProfileIntoDB,
  changePassword,
  getAllUsersFromDB,
  deleteUserIntoDB,
  getSingleUserFromDB,
};

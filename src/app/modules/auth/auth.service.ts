import config from "../../config";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { UserModel } from "../user/user.model";
import AppError from "../../errors/AppError";
import { createToken, verifyToken } from "../../utils/auth.utils";


const loginUserIntoDB = async (payload: { email: string; password: string }) => {
  // Check if user exists with email
  const user = await UserModel.findOne({email: payload.email});

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid password");
  }

  // Create JWT tokens
  const jwtPayload = {
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};




const refreshToken = async (token: string) => {
  // checking if the given token is valid
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);

  const { email } = decoded;

  // checking if the user is exist
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
  }


  const jwtPayload = {
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    accessToken,
  };
};




export const authServices = {
  loginUserIntoDB,
  refreshToken
};

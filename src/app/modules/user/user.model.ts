// src/app/modules/user/user.model.ts

import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";
import config from "../../config";
import bcrypt from 'bcrypt';

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    image: { type: String },
    role: {type: String, required: true, enum:["admin", "salesUser", "warehouseUser", "driver"]},
    // privileges: { type: String, required: true, 

    // }
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  );
  next();
});



export const UserModel = model<IUser>("User", userSchema);

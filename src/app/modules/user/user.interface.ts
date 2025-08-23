
export interface IUser{
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "salesUser" | "warehouseUser" | "driver";
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

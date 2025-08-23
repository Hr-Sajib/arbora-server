import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { ProspectServices } from "./prospect.service";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { sendProspectDutyEmailToSalesPerson } from "../../utils/sendMail";
import { ProspectModel } from "./prospect.model";

const createProspect = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const result = await ProspectServices.createProspectIntoDB(body);

  try {
    if (body.assignedSalesPerson) {
      const salesPersonExists = await UserModel.findById(
        body.assignedSalesPerson
      );
      if (!salesPersonExists) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Sales person does not exist!"
        );
      }

      sendProspectDutyEmailToSalesPerson(
        `${salesPersonExists.email}`,
        `${result?._id}`,
        `${result?.storeName}`
      );
    }
  } catch (error) {
    console.log("Error sending email:", error);
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Prospect created successfully",
    data: result,
  });
});

const getAllProspects = catchAsync(async (req: Request, res: Response) => {
  const user = req?.user;

  let result;
  if (user?.role == "admin") {
    result = await ProspectModel.find({ isDeleted: false })
      .populate("assignedSalesPerson")
      .populate("quotedList.productObjId");
  } else {
    result = await ProspectServices.getAllProspectsFromDB(user?.email);
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your Assigned Prospects fetched successfully",
    data: result,
  });
});

const getSingleProspect = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProspectServices.getSingleProspectFromDB(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Prospect not found");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Prospect fetched successfully",
    data: result,
  });
});

const updateProspect = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  let result;

  if (req?.user?.role !== "admin") {
    const { assignedSalesPerson, ...restPayload } = updatePayload;
    result = await ProspectServices.updateProspectIntoDB(id, restPayload);
  } else {
    result = await ProspectServices.updateProspectIntoDB(id, updatePayload);
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Prospect updated successfully",
    data: result,
  });
});

const deleteProspect = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProspectServices.deleteProspectIntoDB(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Prospect deleted successfully",
    data: result,
  });
});

const makeCustomer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProspectServices.makeCustomerFromProspect(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer created from prospect successfully",
    data: result,
  });
});

const sendQuoteToProspect = catchAsync(async (req: Request, res: Response) => {
  const { prospectId } = req.params;

  const result = await ProspectServices.sendQuoteToProspect(prospectId);

  res.status(httpStatus.OK).json({
    success: true,
    message: result.message || "Quote email sent successfully",
    data: result,
  });
});

export const ProspectControllers = {
  createProspect,
  getAllProspects,
  getSingleProspect,
  updateProspect,
  deleteProspect,
  makeCustomer,
  sendQuoteToProspect,
};

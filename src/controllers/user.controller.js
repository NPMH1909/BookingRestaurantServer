import { HttpStatusCode } from "axios"
import { Response } from "../dto/response/response.js"
import { UserService } from "../services/user.service.js"
import { CommonUtils } from "../utils/common.util.js"
import { BadRequestError } from "../errors/badRequest.error.js"
import { MailService } from "../services/mail.service.js"
import StaffModel from "../models/staff.model.js"
import UserModel from "../models/user.model.js"

const loginUser = async (req, res, next) => {
  try {
    const result = await UserService.login(req.body)
    return new Response(HttpStatusCode.Ok, 'Đăng nhập thành công', result).resposeHandler(res)
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const loginAdmin = async (req, res, next) => {
  try {
    const result = await UserService.adminLogin(req.body)
    next(new Response(HttpStatusCode.Ok, 'Đăng nhập thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getUserById = async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.user.id)
    if (!user) {
      throw new BadRequestError('Không thấy tài khoản')
    }
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy tài khoản', user).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const registerStaff = async (req, res, next) => {
  try {

    const { restaurantId } = req.params
    const data = { ...req.body, restaurantId }
    const result = await UserService.registerStaff(data)
    next(new Response(HttpStatusCode.Created, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const registerStaffByManager = async (req, res, next) => {
  try {

    const managerId = req.user.id
    const data = { ...req.body, managerId }
    const result = await UserService.registerStaffByManager(data)
    next(new Response(HttpStatusCode.Created, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const registerManager = async (req, res, next) => {
  try {

    const { restaurantId } = req.params
    const data = { ...req.body, restaurantId }
    const result = await UserService.registerManager(data)
    next(new Response(HttpStatusCode.Created, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getStaffsByRestaurantId = async (req, res, next) => {
  try {
    const { page, limit } = req.query
    const { restaurantId } = req.params
    const users = await UserService.getStaffsByRestaurantId(restaurantId, Number(page) || 1, Number(limit) || 5)
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy tài khoản', users.data, users.pagination).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

export const getManagerByRestaurantId = async (req, res, next) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const { restaurantId } = req.params;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    const users = await UserModel.find({ restaurantId })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const total = await UserModel.countDocuments({ restaurantId });

    const pagination = {
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalRecords: total,
    };

    next(
      new Response(200, 'Đã tìm thấy tài khoản', users, pagination).resposeHandler(res)
    );
  } catch (error) {
    next(
      new Response(
        error.statusCode || 500,
        error.message || 'Internal server error',
        null
      ).resposeHandler(res)
    );
  }
};
const getStaffsByManagerId = async (req, res, next) => {
  try {
    const { page, limit } = req.query
    const managerId = req.user.id
    const users = await UserService.getStaffsByManagerId(managerId, Number(page) || 1, Number(limit) || 5)
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy tài khoản', users.data, users.pagination).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await UserService.deleteUser(id)
    if (!user) {
      throw new BadRequestError('Không thấy tài khoản')
    }
    next(new Response(HttpStatusCode.Ok, 'Xóa tài khoản thành công', null).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const register = async (req, res, next) => {
  try {
    // #swagger.tags=['User']
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Tài khoản là bắt buộc')
    }
    const result = await UserService.register(req.body)
    next(new Response(HttpStatusCode.Created, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    return new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res)
  }
}
const changePassword = async (req, res, next) => {
  try {
    console.log('req.body', req.body)
    const userId = req.user.id
    const { oldPassword, newPassword } = req.body
    const result = await UserService.changePassword({ userId, oldPassword, newPassword })
    next(new Response(HttpStatusCode.Ok, 'Đăng nhập thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await UserService.updateUser(id, req.body)
    next(new Response(HttpStatusCode.Ok, 'Cập nhật tài khoản thành công', user).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const updateUserById = async (req, res, next) => {
  try {
    console.log('data', req.body)
    const user = await UserService.updateUserById(req.user.id, req.body)
    next(new Response(HttpStatusCode.Ok, 'Cập nhật tài khoản thành công', user).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { code, newPassword } = req.body
    const result = await UserService.resetPassword(code, newPassword)
    next(new Response(HttpStatusCode.Ok, 'Đổi mật khẩu thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const sendResetPasswordEmail = async (req, res, next) => {
  try {
    const { to } = req.body

    if (!to) {
      throw new BadRequestError('Email là bắt buộc')
    }

    const result = await MailService.sendResetPasswordMail(to)
    next(new Response(HttpStatusCode.Ok, 'Gửi thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getStaffById = async (req, res, next) => {
  try {
    const id = req.user.id
    const result = await UserService.getStaffById(id)
    next(new Response(HttpStatusCode.Ok, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getRestaurantByStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;

    const staff = await StaffModel.findOne({ userId: staffId });
    if (!staff) {
      throw new Error('Không tìm thấy nhân viên');
    }

    const restaurantId = staff.restaurantId;

    next(
      new Response(HttpStatusCode.Ok, 'Lấy restaurantId thành công', restaurantId).resposeHandler(res)
    );
  } catch (error) {
    next(
      new Response(
        error.statusCode || HttpStatusCode.InternalServerError,
        error.message,
        null
      ).resposeHandler(res)
    );
  }
};

export const UserController = {
  loginUser,
  loginAdmin,
  getUserById,
  registerStaff,
  deleteUser,
  getStaffsByRestaurantId,
  register,
  changePassword,
  updateUserById,
  updateUser,
  resetPassword,
  sendResetPasswordEmail,
  getStaffById,
  getRestaurantByStaff,
  registerManager,
  getStaffsByManagerId,
  registerStaffByManager,
  getManagerByRestaurantId
}

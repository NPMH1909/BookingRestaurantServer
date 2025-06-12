import { HttpStatusCode } from "axios"
import { Response } from "../dto/response/response.js"
import { UserService } from "../services/user.service.js"
import { CommonUtils } from "../utils/common.util.js"
import { BadRequestError } from "../errors/badRequest.error.js"
import { MailService } from "../services/mail.service.js"
import StaffModel from "../models/staff.model.js"

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
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await UserService.deleteUser(id)
    if (!user) {
      throw new BadRequestError('Không thấy tài khoản')
    }
    next(new Response(HttpStatusCode.Ok, 'Xóa tài khoản thành công', null).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xóa nhân viên', error.statusCode || HttpStatusCode.InternalServerError)
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
  getRestaurantByStaff
}

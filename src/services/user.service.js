import { Types } from "mongoose"
import { USER_ROLE } from "../constants/role.constant.js"
import { BadRequestError } from "../errors/badRequest.error.js"
import { createApiKey } from "../middlewares/useApiKey.middleware.js"
import { checkPassword, createHash } from "../middlewares/usePassword.js"
import UserModel from "../models/user.model.js"
import RestaurantModel from "../models/restaurant.model.js"
import StaffModel from "../models/staff.model.js"
import { ConflictError } from "../errors/conflict.error.js"
import { NotFoundError } from "../errors/notFound.error.js"

const login = async ({ username, password }) => {

  const user = await UserModel.findOne({
    $and: [
      {
        $or: [{ username }, { email: username }, { phone: username }]
      },
      { deleted_at: null }
    ]
  }).orFail(() => {
    throw new BadRequestError('Username or password is incorrect')
  })
  const isPasswordValid = await checkPassword(password, user.salt, user.password)
  if (!isPasswordValid) {
    throw new BadRequestError('Username or password is incorrect')
  }
  if (user.salt === undefined) {
    throw new BadRequestError('Tài khoản đã bị khóa')
  }
  return createApiKey(user._id, user.role)
}

const adminLogin = async ({ username, password }) => {
  const user = await UserModel.findOne({
    $and: [{ $or: [{ email: username }, { phone: username }] }, { deleted_at: null }]
  }).orFail(() => {
    throw new BadRequestError('Username or password is incorrect')
  })
  const isPasswordValid = await checkPassword(password, user.salt, user.password)
  if (!isPasswordValid) {
    throw new BadRequestError('Invalid username or password')
  }
  if (user.role === USER_ROLE.RESTAURANT_OWNER) {
    return {
      redirect_url: '/dashboard',
      role: user.role,
      token: createApiKey(user._id, user.role)
    }
  } else if (user.role === USER_ROLE.STAFF) {
    return {
      redirect_url: '/staff',
      role: user.role,
      token: createApiKey(user._id, user.role)
    }
  }
  else if (user.role === USER_ROLE.MANAGER) {
    return {
      redirect_url: '/manager',
      role: user.role,
      token: createApiKey(user._id, user.role)
    }
  }
  else if (user.role === USER_ROLE.ADMIN) {
    return {
      redirect_url: '/admin',
      role: user.role,
      token: createApiKey(user._id, user.role)
    }
  }
  else {
    throw new BadRequestError('Invalid role')
  }
}

const authorize = async (id) => {
  id = Types.ObjectId.createFromHexString(id)
  return await UserModel.findById(id)
}

const getUserById = async (id) => {
  return UserModel.findById(id, { _id: 1, name: 1, phone: 1, email: 1, username: 1 }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}
const registerStaff = async ({ password, phone, email, name, restaurantId }) => {
  if ((await RestaurantModel.findById(restaurantId)) === null) {
    throw new NotFoundError('Restaurant not found')
  }
  if (await UserModel.findOne({ email })) {
    throw new BadRequestError('Account existed')
  }
  const salt = createApiKey(Math.random().toString(36).substring(2))

  const user = new UserModel({
    _id: new Types.ObjectId(),
    password: await createHash(password + salt),
    phone,
    email,
    name,
    role: USER_ROLE.STAFF,
    salt
  })
  const staff = new StaffModel({
    restaurantId,
    userId: user._id
  })
  // MailService.sendMail({
  //   to: email,
  //   subject: 'Wellcome to Mindx Restaurant',
  //   html: `<h1>User name của bạn là: <strong>${username} </h1><p>Password của bạn là: <strong>${password}</strong></p>`
  // })
  await user.save()
  return await staff.save()
}

const registerStaffByManager = async ({ password, phone, email, name, managerId }) => {
  const manager = await UserModel.findById(managerId);
  if (!manager || !manager.restaurantId) {
    throw new Error("Manager does not have an assigned restaurant");
  }

  const restaurantId = manager.restaurantId;

  if ((await RestaurantModel.findById(restaurantId)) === null) {
    throw new NotFoundError('Restaurant not found')
  }
  if (await UserModel.findOne({ email })) {
    throw new BadRequestError('Account existed')
  }
  const salt = createApiKey(Math.random().toString(36).substring(2))

  const user = new UserModel({
    _id: new Types.ObjectId(),
    password: await createHash(password + salt),
    phone,
    email,
    name,
    role: USER_ROLE.STAFF,
    salt
  })
  const staff = new StaffModel({
    restaurantId,
    userId: user._id
  })
  // MailService.sendMail({
  //   to: email,
  //   subject: 'Wellcome to Mindx Restaurant',
  //   html: `<h1>User name của bạn là: <strong>${username} </h1><p>Password của bạn là: <strong>${password}</strong></p>`
  // })
  await user.save()
  return await staff.save()
}
const getStaffsByRestaurantId = async (restaurantId, page = 1, limit = 5) => {
  const objectRestaurantId = new Types.ObjectId(restaurantId);

  const staffs = await StaffModel.aggregate([
    { $match: { restaurantId: objectRestaurantId } },
    {
      $lookup: {
        from: 'users', // Phải là 'users' (viết thường)
        localField: 'userId',
        foreignField: '_id',
        as: 'staff'
      }
    },
    { $unwind: '$staff' },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        restaurantId: 1,
        staff: {
          name: 1,
          email: 1,
          phone: 1,
          username: 1
        }
      }
    }
  ]);

  const count = await StaffModel.countDocuments({ restaurantId: objectRestaurantId });

  return {
    data: staffs,
    pagination: {
      totalCount: count,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

const getStaffsByManagerId = async (managerId, page = 1, limit = 5) => {
  const user = await UserModel.findById(managerId);
  if (!user || !user.restaurantId) {
    throw new Error("Manager does not have an assigned restaurant");
  }

  const restaurantId = user.restaurantId;
  const objectRestaurantId = new Types.ObjectId(restaurantId);

  const staffs = await StaffModel.aggregate([
    { $match: { restaurantId: objectRestaurantId } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'staff'
      }
    },
    { $unwind: '$staff' },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        restaurantId: 1,
        staff: {
          name: 1,
          email: 1,
          phone: 1,
          username: 1
        }
      }
    }
  ]);

  const count = await StaffModel.countDocuments({ restaurantId: objectRestaurantId });

  return {
    data: staffs,
    pagination: {
      totalCount: count,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};


const deleteUser = async (id) => {
  // Tìm staff theo ID
  const staff = await StaffModel.findById(id).orFail(() => {
    throw new NotFoundError('Staff not found');
  });

  // Cập nhật role userId trong bảng Users
  await UserModel.findByIdAndUpdate(
    staff.userId,
    { role: USER_ROLE.USER },
    { new: true }
  ).orFail(() => {
    throw new NotFoundError('User not found');
  });

  // Xóa staff khỏi bảng Staffs
  await StaffModel.findByIdAndDelete(id);

  return {
    message: 'Cập nhật vai trò và xóa nhân viên thành công',
    userId: staff.userId
  };
};

const register = async ({ password, phone, email, name }) => {
  if (await UserModel.findOne({ email })) {
    throw new ConflictError('Account existed')
  }
  if (await UserModel.findOne({ phone })) {
    throw new ConflictError('Phone existed')
  }
  const salt = createApiKey(Math.random().toString(36).substring(2))
  const user = new UserModel({
    _id: new Types.ObjectId(),
    password: await createHash(password + salt),
    phone,
    email,
    name,
    role: USER_ROLE.USER,
    salt
  })
  return await user.save()
}
const registerManager = async ({ password, phone, email, name, restaurantId }) => {
  if (await UserModel.findOne({ email })) {
    throw new ConflictError('Account existed');
  }
  if (await UserModel.findOne({ phone })) {
    throw new ConflictError('Phone existed');
  }
  const salt = createApiKey(Math.random().toString(36).substring(2));
  const user = new UserModel({
    _id: new Types.ObjectId(),
    password: await createHash(password + salt),
    phone,
    email,
    name,
    role: USER_ROLE.MANAGER,
    salt,
    restaurantId,
  });
  return await user.save();
};

const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await UserModel.findById(userId).orFail(() => {
    throw new BadRequestError('User not found')
  })

  const isOldPasswordValid = await checkPassword(oldPassword, user.salt, user.password)
  if (!isOldPasswordValid) {
    throw new BadRequestError('Old password is incorrect')
  }

  const newSalt = createApiKey(Math.random().toString(36).substring(2))
  const hashedNewPassword = await createHash(newPassword + newSalt)

  user.password = hashedNewPassword
  user.salt = newSalt
  await user.save()

  return { message: 'Password changed successfully' }
}

const updateUser = async (id, { name, restaurantId }) => {
  const staff = await StaffModel.findByIdAndUpdate(id, { restaurantId }).orFail(() => {
    throw new NotFoundError('User not found')
  })
  return await UserModel.findByIdAndUpdate(staff.userId, { name }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}
const updateUserById = async (id, data) => {
  return await UserModel.findByIdAndUpdate(id, { ...data }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}

const resetPassword = async (otp, newPassword) => {
  const user = await UserModel.findOne({ otp });
  if (!user) {
    throw new BadRequestError('Mã OTP không hợp lệ hoặc đã hết hạn');
  }

  const hashedPassword = await createHash(newPassword + user.salt);

  await UserModel.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    otp: null, // Xoá OTP sau khi sử dụng
    updated_at: Date.now(),
  });

  return { message: 'Đặt lại mật khẩu thành công' };
};

const getStaffById = async (id) => {
  return StaffModel.findOne({ userId: id }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}
export const UserService = {
  adminLogin,
  authorize,
  login,
  getUserById,
  registerStaff,
  getStaffsByRestaurantId,
  deleteUser,
  register,
  changePassword,
  updateUserById,
  updateUser,
  resetPassword,
  getStaffById,
  registerManager,
  registerStaffByManager,
  getStaffsByManagerId
}
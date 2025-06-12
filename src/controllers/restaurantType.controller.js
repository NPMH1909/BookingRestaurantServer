import { RestaurantTypeService } from '../services/restaurantType.service.js';

const createType = async (req, res) => {
  try {
    console.log('req', req.body)
    const { name } = req.body;
    const result = await RestaurantTypeService.createRestaurantType({ name });

    return res.status(201).json({
      success: true,
      message: 'Tạo loại nhà hàng thành công.',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Tạo loại nhà hàng thất bại.',
      error: error.message,
    });
  }
};

const updateType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name } = req.body;

    const result = await RestaurantTypeService.updateRestaurantType({ typeId, name });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật loại nhà hàng thành công.',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Cập nhật loại nhà hàng thất bại.',
      error: error.message,
    });
  }
};

const deleteType = async (req, res) => {
  try {
    const { typeId } = req.params;

    const result = await RestaurantTypeService.deleteRestaurantType({ typeId });

    return res.status(200).json({
      success: true,
      message: 'Xoá loại nhà hàng thành công.',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Xoá loại nhà hàng thất bại.',
      error: error.message,
    });
  }
};

const getAllTypes = async (req, res) => {
  try {
    const result = await RestaurantTypeService.getAllRestaurantTypes();
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách loại nhà hàng thành công.',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lấy danh sách loại nhà hàng thất bại.',
      error: error.message,
    });
  }
};

export const RestaurantTypeController = {
  createType,
  updateType,
  deleteType,
  getAllTypes,
};

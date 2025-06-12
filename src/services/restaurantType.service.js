import RestaurantTypeModel from "../models/restaurantType.model.js";

const createRestaurantType = async ({ name }) => {
    const type = new RestaurantTypeModel({ name });
    return await type.save();
};

const updateRestaurantType = async ({ typeId, name }) => {
    const updated = await RestaurantTypeModel.findByIdAndUpdate(
        typeId,
        { name },
        { new: true, runValidators: true }
    );
    if (!updated) {
        throw new Error('Không tìm thấy loại nhà hàng để cập nhật.');
    }
    return updated;
};

const deleteRestaurantType = async ({ typeId }) => {
    const deleted = await RestaurantTypeModel.findByIdAndDelete(typeId);
    if (!deleted) {
        throw new Error('Không tìm thấy loại nhà hàng để xoá.');
    }
    return deleted;
};

const getAllRestaurantTypes = async () => {
    return await RestaurantTypeModel.find()
        .sort({ name: 1 })
        .select('name');
};


export const RestaurantTypeService = {
    createRestaurantType,
    updateRestaurantType,
    deleteRestaurantType,
    getAllRestaurantTypes,
};

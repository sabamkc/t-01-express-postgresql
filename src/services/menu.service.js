const menuRepository = require('../repositories/menu.repository');
const AppError = require('../errors/AppError');

const getMenuItems = async () => {
    return await menuRepository.getAllMenuItems();
}

const addMenuItem = async(itemName) => {
    if(!itemName || itemName.trim() == '') throw new AppError('Item name is required', 400);
    return await menuRepository.createMenuItem(itemName);
}

module.exports = {
    getMenuItems,
    addMenuItem
}
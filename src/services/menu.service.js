const menuRepository = require('../repositories/menu.repository');

const getMenuItems = async () => {
    return await menuRepository.getAllMenuItems();
}

const addMenuItem = async(itemName) => {
    if(!itemName || itemName.trim() == '') throw new Error('Item name required');
    return await menuRepository.createMenuItem(itemName);
}

module.exports = {
    getMenuItems,
    addMenuItem
}
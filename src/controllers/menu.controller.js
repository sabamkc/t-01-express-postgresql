const menuService = require('../services/menu.service');

const getMenuItems = async (req, res, next) => {
    try {
        const items = await menuService.getMenuItems();
        res.status(200).json(items);
    }
    catch(err){
        next(err);
    }
}

const createMenuItem = async(req, res, next) => {
    try {
        const {item_name} = req.body;
        const newItem = await menuService.addMenuItem(item_name);
        res.status(201).json(newItem);
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    getMenuItems,
    createMenuItem
}
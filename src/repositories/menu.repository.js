const pool = require('../config/db');

const getAllMenuItems = async () => {
    const getAllMenuItemsQuery = `
    SELECT *
    FROM menu_items
    ORDER BY item_id
    `;
    const { rows } = await pool.query(getAllMenuItemsQuery);
    return rows;
}

const createMenuItem = async (itemName) => {
    const createMenuItemQuery = `
    INSERT INTO menu_items (item_name) 
    VALUES ($1) 
    RETURNING item_id, item_name
    `;
    const { rows } = await pool.query(createMenuItemQuery, [itemName]);
    return rows[0];
}

module.exports = {
    getAllMenuItems,
    createMenuItem
}
const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const validate = require('../middlewares/validate');
const { createMenuItemSchema } = require('../schemas/menu.schema');

router.get('/', menuController.getMenuItems);
router.post('/', validate(createMenuItemSchema), menuController.createMenuItem);

module.exports = router;
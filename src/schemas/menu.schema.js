const { z } = require('zod');

exports.createMenuItemSchema = z.object({
  item_name: z.string().min(1),
});

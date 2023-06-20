const router = require("express").Router();
const auth = require("../middlewares/auth");
const BlockController = require("../controllers/BlockController");

/**
 * @openapi
 * components:
 *   schemas:
 *     Block:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           description: Logged user id
 *           example: 6491676b7a711cd148d40079
 *         blocked_id:
 *           type: string
 *           description: Blocked user id
 *           example: 64899374a4ee197dcc5c63f7
 *         created_at:
 *           type: string
 *           format: date
 *           description: Datetime when block is produced
 *           example: 2023-06-20T10:56:29.337Z
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 */

/**
 * @openapi
 * /api/v1/block:
 *   post:
 *     tags:
 *       - Blocks
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 block:
 *                   type: object
 *                   $ref: '#/components/schemas/Block'
 *
 */

router.post("/add/:blockedId", auth, BlockController.add);
router.delete("/pardon/:id", auth, BlockController.pardon);

module.exports = router;
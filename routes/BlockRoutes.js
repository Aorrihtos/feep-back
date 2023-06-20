const router = require("express").Router();
const auth = require("../middlewares/auth");
const BlockController = require("../controllers/BlockController");

/**
 * @openapi
 * tags:
 *   - name: Blocks
 *     description: Do and undo block actions
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
 *     500Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Final status of the request
 *           example: error
 *         message:
 *           type: string
 *           description: Error message
 *           example: Internal Server Error
 */

/**
 * @openapi
 * /api/v1/block/add/{blockedId}:
 *   post:
 *     tags:
 *       - Blocks
 *     summary: Block a user
 *     description: Blocks a user, using the logged user.
 *     parameters:
 *       - name: blockedId
 *         in: path
 *         description: ObjectId of the user to block
 *         required: true
 *         example: 64899374a4ee197dcc5c63f7
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
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/add/:blockedId", auth, BlockController.add);

/**
 * @openapi
 * /api/v1/block/pardon/{id}:
 *   delete:
 *     tags:
 *       - Blocks
 *     summary: Pardon a user
 *     description: Pardon a user previously blocked, using the logged user.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Mongo ObjectId of the block document
 *         required: true
 *         example: 64918602143b41c789e2eddf
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
 *                 block_deleted:
 *                   type: object
 *                   $ref: '#/components/schemas/Block'
 *       404:
 *         description: Client Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Block not found
 *
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.delete("/pardon/:id", auth, BlockController.pardon);

module.exports = router;
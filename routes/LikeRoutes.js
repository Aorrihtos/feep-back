const router = require("express").Router();
const LikeController = require("../controllers/LikeController");
const auth = require("../middlewares/auth");

/**
 * @openapi
 * tags:
 *   - name: Likes
 *     description: Everything about likes
 * components:
 *   schemas:
 *     Like:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           description: Logged user id
 *           example: 6491676b7a711cd148d40079
 *         post_id:
 *           type: string
 *           description: Post id
 *           example: 64899374a4ee197dcc5c63f7
 *         created_at:
 *           type: string
 *           format: date
 *           description: Datetime when comment is send
 *           example: 2023-06-20T10:56:29.337Z
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 */

/**
 * @openapi
 * /like/add/{postId}:
 *   post:
 *     tags:
 *       - Likes
 *     summary: Give like to a post
 *     description: Give like to a post of any user
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: ObjectId of the post to like
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
 *                 like:
 *                   type: object
 *                   $ref: '#/components/schemas/Like'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/add/:postId", auth, LikeController.like);

/**
 * @openapi
 * /like/unlike/{postId}:
 *   delete:
 *     tags:
 *       - Likes
 *     summary: Unlike a post
 *     description: Unlike a post of any user previously liked by the logged user
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: ObjectId of the post to unlike
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
 *                 like_deleted:
 *                   type: object
 *                   $ref: '#/components/schemas/Like'
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
 *                   message: Like not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.delete("/unlike/:postId", auth, LikeController.unlike);

module.exports = router;
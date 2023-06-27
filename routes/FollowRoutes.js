const express = require("express");
const FollowController = require("../controllers/FollowController");
const auth = require("../middlewares/auth")
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Follows
 *     description: Everything about follows
 * components:
 *   schemas:
 *     Follow:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           description: Logged user id
 *           example: 6491676b7a711cd148d40079
 *         followed_id:
 *           type: string
 *           description: Followed user id
 *           example: 64899374a4ee197dcc5c63f7
 *         created_at:
 *           type: string
 *           format: date
 *           description: Datetime when follow is done
 *           example: 2023-06-20T10:56:29.337Z
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *
 */

/**
 * @openapi
 * /follow/add/{userId}:
 *   post:
 *     tags:
 *       - Follows
 *     summary: Follow a user
 *     description: Follow a user as the logged user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ObjectId of the user to follow
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
 *                 follow:
 *                   type: object
 *                   $ref: '#/components/schemas/Follow'
 *       400:
 *         description: Client error
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
 *                   example: You already are following the user
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/add/:userId", auth, FollowController.follow);

/**
 * @openapi
 * /follow/unfollow/{userId}:
 *   delete:
 *     tags:
 *       - Follows
 *     summary: Unfollow a user
 *     description: Unfollow a user previously followed as the logged user
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ObjectId of the user to unfollow
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
 *                 follow_deleted:
 *                   type: object
 *                   $ref: '#/components/schemas/Follow'
 *       404:
 *         description: Client error
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
 *                   example: Follow not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.delete("/unfollow/:userId", auth, FollowController.unfollow);

module.exports = router;
const router = require("express").Router();
const CommentController = require("../controllers/CommentController");
const auth = require("../middlewares/auth");

/**
 * @openapi
 * tags:
 *   - name: Comments
 *     description: Everything about comments
 * components:
 *   schemas:
 *     Comment:
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
 *         content:
 *           type: string
 *           description: Content of the comment
 *           example: Nice post!
 *         likes:
 *           type: Number
 *           description: Like counter of the comment
 *           example: 7
 *         created_at:
 *           type: string
 *           format: date
 *           description: Datetime when comment is send
 *           example: 2023-06-20T10:56:29.337Z
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *     CommentWithUserInfo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *         user_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: Mongo document id of the user
 *               example: 64918602143b41c789e2eddf
 *             username:
 *               type: string
 *               description: Username of the user
 *               example: Aorih
 *             profile_pic:
 *               type: string
 *               description: Name of the profile pic of the user
 *               example: default-profile.png
 *         content:
 *           type: string
 *           description: Content of the comment
 *           example: Nice post!
 *         likes:
 *           type: Number
 *           description: Like counter of the comment
 *           example: 7
 *         created_at:
 *           type: string
 *           format: date
 *           description: Datetime when comment is send
 *           example: 2023-06-20T10:56:29.337Z
 */

/**
 * @openapi
 * /comment/send/{postId}:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Send a comment
 *     description: Send a comment to a post as the logged user
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: ObjectId of the post to comment
 *         required: true
 *         example: 64899374a4ee197dcc5c63f7
 *     requestBody:
 *       description: Content of the comment
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: First comment
 *       required: true
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
 *                 comment:
 *                   type: object
 *                   $ref: '#/components/schemas/Comment'
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
 *                   example: No data was provided
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/send/:postId", auth, CommentController.send);

/**
 * @openapi
 * /comment/remove/{id}:
 *   delete:
 *     tags:
 *       - Comments
 *     summary: Delete a comment
 *     description: Delete a comment done by the logged user
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the comment to delete
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
 *                 comment_deleted:
 *                   type: object
 *                   $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
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
 *                   example: Comment not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.delete("/remove/:id", auth, CommentController.remove);

/**
 * @openapi
 * /comment/like/{id}:
 *   put:
 *     tags:
 *       - Comments
 *     summary: Give a like to a comment
 *     description: Give a like to a comment done by any user
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the comment
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
 *                 comment:
 *                   type: object
 *                   $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
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
 *                   example: Comment not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.put("/like/:id", auth, CommentController.like);

/**
 * @openapi
 * /comment/unlike/{id}:
 *   put:
 *     tags:
 *       - Comments
 *     summary: Remove a like of a comment
 *     description: Remove a like of a comment done by any user and previously given by the logged user
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the comment
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
 *                 comment:
 *                   type: object
 *                   $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
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
 *                   example: Comment not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.put("/unlike/:id", auth, CommentController.unlike);

module.exports = router;
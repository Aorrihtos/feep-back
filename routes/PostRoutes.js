const router = require("express").Router();
const PostController = require("../controllers/PostController");
const auth = require("../middlewares/auth");
const multer = require("multer");

const storage = multer.memoryStorage()

const upload = multer({storage}).single("file0")

/**
 * @openapi
 * tags:
 *   - name: Posts
 *     description: Everything about Posts
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           description: ObjectId of the user who published the post
 *           example: 6491676b7a711cd148d40079
 *         content:
 *           type: String
 *           description: Text content of the post
 *           example: Hello world on feep!
 *         attached_file:
 *           type: String
 *           description: Name and extension of the attached file. It can be null.
 *           example: vacations-aorih.png
 *         created_at:
 *           type: string
 *           format: date
 *           description: Datetime when the post is published
 *           example: 2023-06-20T10:56:29.337Z
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *     PostWithUserInfo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *         user_id:
 *           type: object
 *           $ref: '#/components/schemas/User'
 *         content:
 *           type: String
 *           description: Text content of the post
 *           example: Hello world on feep!
 *         attached_file:
 *           type: String
 *           description: Name and extension of the attached file. It can be null.
 *           example: vacations-aorih.png
 *         created_at:
 *           type: string
 *           format: date
 *           description: Datetime when the post is published
 *           example: 2023-06-20T10:56:29.337Z
 *     FeedItem:
 *       allOf:
 *         - $ref: '#/components/schemas/PostWithUserInfo'
 *         - type: object
 *           properties:
 *             likes:
 *               type: Number
 *               description: Number of likes of the post
 *               example: 74
 *             comments:
 *               type: Number
 *               description: Number of comments of the post
 *               example: 10
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: Number
 *           example: 1
 *         total_pages:
 *           type: Number
 *           example: 2
 *         total_items:
 *           type: Number
 *           example: 14
 *         items_per_page:
 *           type: Number
 *           example: 10
 */

/**
 * @openapi
 * /post/upload:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Upload a post
 *     description: Upload a post as the logged user
 *     consumes:
 *          - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file0
 *         type: file
 *         description: The file to upload.
 *         required: false
 *       - in: formData
 *         name: content
 *         type: string
 *         description: Text content of the post
 *         required: true
 *         example: My first post!
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
 *                 post:
 *                   type: object
 *                   $ref: '#/components/schemas/Post'
 *                 reward:
 *                   type: Number
 *                   example: 350
 *                 actual_points:
 *                   type: Number
 *                   example: 7600
 *       400:
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
 *                   example: No content was provided
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/upload", [auth,upload], PostController.upload);

/**
 * @openapi
 * /post/remove/{id}:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Delete a post
 *     description: Delete a post previously published as the logged user
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ObjectId of the post to delete
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
 *                 post_deleted:
 *                   type: object
 *                   $ref: '#/components/schemas/Post'
 *       400:
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
 *                   example: Post not found / You're not the author of the post
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.delete("/remove/:id", auth, PostController.remove);

/**
 * @openapi
 * /post/detail/{id}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get detail of a post
 *     description: Get detail of a post published by any user
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ObjectId of the post to get detail
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
 *                 post:
 *                   type: object
 *                   $ref: '#/components/schemas/PostWithUserInfo'
 *                 likes:
 *                   type: Number
 *                   example: 7
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommentWithUserInfo'
 *                 pagination:
 *                   type: object
 *                   $ref: '#/components/schemas/Pagination'
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
 *                   example: Post not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/detail/:id", auth, PostController.detail);
router.get("/image/:id", auth, PostController.image);
router.get("/comments/:id", auth, PostController.getComments);

module.exports = router;
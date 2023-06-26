const router = require("express").Router();
const PostController = require("../controllers/PostController");
const auth = require("../middlewares/auth");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "./uploads/posts")
    },
    filename: (req,file,cb) =>{
        cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`)
    }
});

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
 */

/**
 * @openapi
 * /api/v1/post/upload:
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
router.delete("/remove/:id", auth, PostController.remove);
router.get("/detail/:id", auth, PostController.detail);

module.exports = router;
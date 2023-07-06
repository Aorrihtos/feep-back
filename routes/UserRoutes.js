const express = require("express");
const UserController = require("../controllers/UserController");
const multer = require("multer");
const router = express.Router();

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null,"./uploads/profiles")
    },
    filename: (req, file, cb) =>{
        cb(null, `${req.user.username}-${file.originalname}`)
    }
});

// Middlewares
const auth = require("../middlewares/auth");
const uploads = multer({storage});

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: Everything about Users
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *         name:
 *           type: string
 *           description: Name of the user
 *           example: Sergio
 *         surname:
 *           type: string
 *           description: Surname of the user. Can be null.
 *           example: Ferrer Canet
 *         username:
 *           type: string
 *           description: Username of the user
 *           example: Aorih
 *         profile_pic:
 *           type: string
 *           description: Name of the profile pic of the user
 *           example: default-profile.png
 *     UserWithEmail:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             email:
 *               type: string
 *               description: Email of the user
 *               example: aorih@gmail.com
 *     UserRanking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *         name:
 *           type: string
 *           description: Name of the user
 *           example: Sergio
 *         surname:
 *           type: string
 *           description: Surname of the user. Can be null.
 *           example: Ferrer Canet
 *         username:
 *           type: string
 *           description: Username of the user
 *           example: Aorih
 *         profile_pic:
 *           type: string
 *           description: Name of the profile pic of the user
 *           example: default-profile.png
 *         views:
 *           type: Number
 *           description: Total views of the user profile
 *           example: 2546
 *     CleanedUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *         name:
 *           type: string
 *           description: Name of the user
 *           example: Sergio
 *         surname:
 *           type: string
 *           description: Surname of the user. Can be null.
 *           example: Ferrer Canet
 *         username:
 *           type: string
 *           description: Username of the user
 *           example: Aorih
 *         email:
 *           type: string
 *           description: Email of the user
 *           example: aorih@gmail.com
 *         profile_pic:
 *           type: string
 *           description: Name of the profile pic of the user
 *           example: default-profile.png
 *         views:
 *           type: Number
 *           description: Total views of the user profile
 *           example: 2546
 *         is_admin:
 *           type: Boolean
 *           description: Indicator of user role
 *           example: false
 */

/**
 * @openapi
 * /user/register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a User
 *     description: Register a new User
 *     requestBody:
 *       description: User info
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: username
 *               password:
 *                 type: string
 *                 example: Pas4D3Prueb4
 *               email:
 *                 type: string
 *                 example: aorih@gmail.com
 *               name:
 *                 type: string
 *                 example: Sergio
 *               surname:
 *                 type: string
 *                 example: Ferrer Canet
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
 *                 user:
 *                   type: object
 *                   $ref: '#/components/schemas/CleanedUser'
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
 *                   example: The username or email is already registered
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/register", UserController.register);

/**
 * @openapi
 * /user/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Do login
 *     description: Do login with a previous registered user
 *     requestBody:
 *       description: Login info
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: username
 *               password:
 *                 type: string
 *                 example: Pas4D3Prueb4
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
 *                 user:
 *                   type: object
 *                   $ref: '#/components/schemas/CleanedUser'
 *                 token:
 *                   type: string
 *                   example: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY0OTE2NzZiN2E3MTFjZDE0OGQ0MDA3OSIsIm5hbWUiOiJSQU5LIiwidXNlcm5hbWUiOiJSYW5rVXNlcjIiLCJlbWFpbCI6InJhbmsyQGdtYWlsLmNvbSIsImlzX2FkbWluIjpmYWxzZSwiY3JlYXRlZCI6MTY4Nzc4MjkwNCwiZXhwIjoxNjg3NzkwMTA0fQ.sP_Dzgv7x0Y-koxaTeIdwlwqoqkAy2XvTMAQ-6T3UBs
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
 *                   example: No data was provided
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
 *                   example: Invalid username or password
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/login", UserController.login);

/**
 * @openapi
 * /user/remove:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
 *     description: Delete the logged user
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
 *                 user_removed:
 *                   type: object
 *                   $ref: '#/components/schemas/CleanedUser'
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
 *                   example: User not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.delete("/remove", auth, UserController.remove);

/**
 * @openapi
 * /user/profile-pic/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get profile pic of a user
 *     description: Get profile pic of a user. By default, the logged one
 *     produces:
 *       - image/jpg
 *       - image/jpeg
 *       - image/gif
 *       - image/png
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the user to retrieve its profile pic. Logged user id by default.
 *         required: false
 *     responses:
 *       200:
 *         description: OK
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
 *                   example: User not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/profile-pic/:id?", auth, UserController.getProfilePic);

/**
 * @openapi
 * /user/upload:
 *   post:
 *     tags:
 *       - Users
 *     summary: Upload a new profile-pic
 *     description: Upload a new profile-pic for the logged user
 *     consumes:
 *          - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file0
 *         type: file
 *         description: The file to upload.
 *         required: true
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
 *                 user:
 *                   type: object
 *                   $ref: '#/components/schemas/CleanedUser'
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
 *                   example: Extension pdf not allowed
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/upload", [auth, uploads.single("file0")], UserController.upload);

/**
 * @openapi
 * /user/update:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update the user info
 *     description: Update the info for the logged user
 *     requestBody:
 *       description: User info
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: username
 *               password:
 *                 type: string
 *                 example: Pas4D3Prueb4
 *               email:
 *                 type: string
 *                 example: aorih@gmail.com
 *               name:
 *                 type: string
 *                 example: Sergio
 *               surname:
 *                 type: string
 *                 example: Ferrer Canet
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
 *                 user:
 *                   type: object
 *                   $ref: '#/components/schemas/CleanedUser'
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
 *                   example: User not found
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.put("/update", auth, UserController.update);

/**
 * @openapi
 * /user/following/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Retrieves the following users
 *     description: Retrieves a list with the users that one user follows (The logged one by default)
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the user to retrieve its following list
 *         required: false
 *       - name: page
 *         in: query
 *         description: Number of page to retrieve
 *         required: false
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
 *                 following:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/UserRanking'
 *                       - type: object
 *                         properties:
 *                           followers:
 *                             type: Number
 *                             example: 10
 *                           points:
 *                             type: Number
 *                             example: 355
 *                 pagination:
 *                   type: object
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/following/:id?", auth, UserController.following);

/**
 * @openapi
 * /user/followers/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Retrieves the followers
 *     description: Retrieves a list with the users that follows one user (The logged one by default)
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the user to retrieve its followers list
 *         required: false
 *       - name: page
 *         in: query
 *         description: Number of page to retrieve
 *         required: false
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
 *                 followers:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/UserRanking'
 *                       - type: object
 *                         properties:
 *                           followers:
 *                             type: Number
 *                             example: 10
 *                           points:
 *                             type: Number
 *                             example: 355
 *                 pagination:
 *                   type: object
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/followers/:id?", auth, UserController.followers);

/**
 * @openapi
 * /user/detail/{id}:
 *   post:
 *     tags:
 *       - Users
 *     summary: Get the user info detailed
 *     description: Get the user info detailed (The logged one by default)
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the user to retrieve
 *         required: false
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       $ref: '#/components/schemas/CleanedUser'
 *                     follow_counter:
 *                       type: object
 *                       properties:
 *                         followers:
 *                           type: Number
 *                           example: 50
 *                         following:
 *                           type: Number
 *                           example: 70
 *                     points:
 *                       type: Number
 *                       example: 7500
 *       403:
 *         description: Forbidden
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
 *                   example: You have been blocked by this user
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.post("/detail/:id?", auth, UserController.detail);

/**
 * @openapi
 * /user/{id}/posts:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get the user posts
 *     description: Get the user posts, ordered descending by creation date (The logged one by default)
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ObjectId of the user
 *         required: false
 *       - name: page
 *         in: query
 *         description: ObjectId of the user to retrieve his posts
 *         required: false
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
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeedItem'
 *                 pagination:
 *                   type: object
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Forbidden
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
 *                   example: You have been blocked by this user
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/:id?/posts", auth, UserController.getPosts);

/**
 * @openapi
 * /user/blocks:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get the user blocks
 *     description: Get the users that the logged one have blocked
 *     parameters:
 *       - name: page
 *         in: query
 *         description: ObjectId of the user to retrieve his posts
 *         required: false
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
 *                 blocked:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlockListItem'
 *                 pagination:
 *                   type: object
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/blocks", auth, UserController.blocked);

/**
 * @openapi
 * /user/feed:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get the user feed
 *     description: Get the logged user feed (the posts of his followings)
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Number of page to retrieve
 *         required: false
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
 *                 feed:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeedItem'
 *                 pagination:
 *                   type: object
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/feed", auth, UserController.feed);

/**
 * @openapi
 * /user/search:
 *   get:
 *     tags:
 *       - Users
 *     summary: Search for a user
 *     description: Find a user searching by any patron
 *     parameters:
 *       - name: user
 *         in: query
 *         description: Patron to search
 *         required: true
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
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/search", auth, UserController.searcher);

router.post("/contact", auth, UserController.contact);

module.exports = router;
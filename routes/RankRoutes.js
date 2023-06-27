const router = require("express").Router();
const RankController = require("../controllers/RankController");

/**
 * @openapi
 * tags:
 *   - name: Ranks
 *     description: Everything about Ranks
 * components:
 *   schemas:
 *     RankItem:
 *       type: object
 *       properties:
 *         user_id:
 *           type: object
 *           $ref: '#/components/schemas/UserRanking'
 *         points:
 *           type: Number
 *           description: Rank points of the user
 *           example: 119
 *         followers:
 *           type: Number
 *           description : Number of followers of the user
 *           example: 2500
 */

/**
 * @openapi
 * /rank/get:
 *   get:
 *     tags:
 *       - Ranks
 *     summary: Get monthly rank
 *     description: Get the monthly rank info of the current month
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
 *                 rank:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RankItem'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/500Error'
 */
router.get("/get", RankController.getRank);

module.exports = router;
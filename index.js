const express = require("express");
const {connection} = require("./database/connector");
const cors = require("cors");
require("dotenv").config();
const app = express();
require("./services/rankService"); // CRONJOB

// Importing Routes
const userRoutes = require("./routes/UserRoutes");
const followRoutes = require("./routes/FollowRoutes");
const postRoutes = require("./routes/PostRoutes");

// Connect to DB
connection().then(r => console.log("Connected to Database!"));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

// Routes
const API_BASEPATH = process.env.API_BASEPATH;
app.use(`${API_BASEPATH}/user`, userRoutes);
app.use(`${API_BASEPATH}/follow`, followRoutes);
app.use(`${API_BASEPATH}/post`, postRoutes);

// Default Route
app.get("/", (req, res)=>{
    return res.status(200).json({
        message: "Welcome to FEEP API"
    });
});

// Initialize the server
app.listen(process.env.PORT, ()=>{
    console.log(`Server listening on port ${process.env.PORT}`);
})


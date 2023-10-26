const express = require("express");
const {connection} = require("./database/connector");
const cors = require("cors");
require("dotenv").config();
const app = express();
require("./services/rankService"); // CRONJOB
const {swaggerDocs} = require("./swagger") // SWAGGER
const Notification = require("./models/Notification");

// Importing Routes
const userRoutes = require("./routes/UserRoutes");
const followRoutes = require("./routes/FollowRoutes");
const postRoutes = require("./routes/PostRoutes");
const likeRoutes = require("./routes/LikeRoutes");
const commentRoutes = require("./routes/CommentRoutes");
const blockRoutes = require("./routes/BlockRoutes");
const rankRoutes = require("./routes/RankRoutes");

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
app.use(`${API_BASEPATH}/like`, likeRoutes);
app.use(`${API_BASEPATH}/comment`, commentRoutes);
app.use(`${API_BASEPATH}/block`, blockRoutes);
app.use(`${API_BASEPATH}/rank`, rankRoutes);

// Default Route
app.get("/", (req, res)=>{
    return res.status(200).json({
        message: "Welcome to FEEP API"
    });
});


// WebSockets with Socket.io
const {connectedUsers} = require('./helpers/connectedUsers');
const {createServer} = require("node:http");
const server = createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origins: ['http://localhost:4200']
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000
    }
})
io.on('connection', (socket)=>{

    console.log("a user has connected")

    const id = JSON.parse(socket.handshake.query.payload.toString())._id;
    console.log(id);
    Notification.find({user_id: id})
        .then(notifications => {
            if(notifications.length > 0){
                notifications.forEach(n => socket.emit("message", n))
            }
        })
        .catch(e => console.log(e))

    if(connectedUsers.findIndex(user => user.id == id) < 0){
        connectedUsers.push({
            id,
            socket
        });
    }

    socket.on('disconnect', ()=>{
        console.log("a User has disconnected");
        const index = connectedUsers.findIndex(user => user.id == id);
        connectedUsers.splice(index, 1);
    });

    socket.on('likedPost', (msg)=>{
        manageNotification(msg.payload, 'likedPost');
    });

    socket.on('likedComment', (msg)=>{
        manageNotification(msg.payload, 'likedComment');
    });

    socket.on('sendComment', (msg)=>{
        manageNotification(msg.payload, 'sendComment');
    });

    socket.on('followed', (msg)=>{
        manageNotification(msg.payload, 'followed');
    });
});

const manageNotification = (payload, event) =>{
    const notifToSave = new Notification({...payload, event});
    if(notifToSave.text.trim() === ""){
        console.log("entro")
        notifToSave.text = "📷 Image"
    }

    const destination = connectedUsers.find(u => u.id == payload.destinyUser);
    if(destination){
        destination.socket.emit("message", notifToSave);
        notifToSave.is_sent = true;
    }
    console.log(notifToSave);
    notifToSave.save();
}

// Initialize the server
server.listen(process.env.PORT, ()=>{
    console.log(`Server listening on port ${process.env.PORT}`);
    swaggerDocs(app, process.env.PORT);
})

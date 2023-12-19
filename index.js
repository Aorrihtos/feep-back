const express = require("express");
const {connection} = require("./database/connector");
const cors = require("cors");
require("dotenv").config();
const app = express();
require("./services/rankService"); // CRONJOB
const {swaggerDocs} = require("./swagger") // SWAGGER
const Notification = require("./models/Notification");
const User = require("./models/User");
const Newsletter = require("./models/Newsletter");

// PUSH API & VAPID KEYS
const webpush = require("web-push");
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
}
webpush.setVapidDetails(
    'mailto:feepsocial@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Importing Routes
const userRoutes = require("./routes/UserRoutes");
const followRoutes = require("./routes/FollowRoutes");
const postRoutes = require("./routes/PostRoutes");
const likeRoutes = require("./routes/LikeRoutes");
const commentRoutes = require("./routes/CommentRoutes");
const blockRoutes = require("./routes/BlockRoutes");
const rankRoutes = require("./routes/RankRoutes");
const notificationRoutes = require("./routes/NotificationRoutes");
const newsletterRoutes = require("./routes/NewsletterRoutes");

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
app.use(`${API_BASEPATH}/notifications`, notificationRoutes);
app.use(`${API_BASEPATH}/newsletter`, newsletterRoutes);

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
        origins: ['http://localhost:4200', 'https://feep-social.es']
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000
    }
})
io.on('connection', (socket)=>{

    const id = JSON.parse(socket.handshake.query.payload.toString())._id;

    // Find if user selected allow push notifications
    Newsletter.find({userId: id})
        .select("-_id -userId -__v")
        .then(subs => {
            socket.emit("allow", subs);
        })
        .catch(err => console.log("Error on find notification permissions"));

    // Send pendent notifications (not readed)
    Notification.find({destinyUser: id, loggedId: {$ne: id}, is_read: false})
        .count()
        .then(notifications => {
                socket.emit("counter", notifications);
        })
        .catch(e => console.log(e))

    // Adding the socket to the userArray
    connectedUsers.push({
        id,
        socket
    });

    // Event triggers
    socket.on('disconnect', ()=>{
        const index = connectedUsers.findIndex(user => user.id == id);
        connectedUsers.splice(index, 1);
    });

    socket.on('likedPost', (msg)=>{
        if(msg.payload.destinyUser !== msg.payload.loggedId){
            manageNotification(msg.payload, 'likedPost');
        }
    });

    socket.on('unlikedPost', (msg)=>{
        Notification.findOneAndDelete({
            loggedId: msg.payload.loggedId,
            idPost: msg.payload.idPost,
            event: 'likedPost',
            is_read: false
        }).exec();
    });

    socket.on('likedComment', (msg)=>{
        if(msg.payload.destinyUser !== msg.payload.loggedId){
            manageNotification(msg.payload, 'likedComment');
        }
    });

    socket.on('unlikedComment', (msg)=>{
        Notification.findOneAndDelete({
            loggedId: msg.payload.loggedId,
            destinyUser: msg.payload.destinyUser,
            event: 'likedComment',
            idComment: msg.payload.idComment,
            is_read: false
        }).exec();
    });

    socket.on('sendComment', (msg)=>{
        if(msg.payload.destinyUser !== msg.payload.loggedId){
            manageNotification(msg.payload, 'sendComment');
        }
    });

    socket.on('deletedComment', (msg)=>{
        console.log("DELETED: " + msg.payload.idComment + " " + msg.payload.loggedId + " " + msg.payload.destinyUser)
        Notification.findOneAndDelete({
            loggedId: msg.payload.loggedId,
            idPost: msg.payload.idPost,
            event: 'sendComment',
            idComment: msg.payload.idComment,
            is_read: false
        }).exec();
    });

    socket.on('followed', (msg)=>{
        if(msg.payload.destinyUser !== msg.payload.loggedId){
            manageNotification(msg.payload, 'followed');
        }
    });

    socket.on('unfollowed', (msg)=>{
        Notification.findOneAndDelete({
            loggedId: msg.payload.loggedId,
            destinyUser: msg.payload.destinyUser,
            event: 'followed',
            is_read: false
        }).exec();
    });
});

const manageNotification = (payload, event) =>{
    const notifToSave = new Notification({...payload, event});
    if(notifToSave.text.trim() === ""){
        notifToSave.text = "📷 Image"
    }

    // Send real-time notification to the user sockets (APP)
    const sockets = connectedUsers.filter(u => u.id == payload.destinyUser).map(r => r.socket);
    if(sockets.length > 0){
        sockets.forEach(s => s.emit("message", notifToSave));
    }

    // Search if the user allowed notifications to send by Push API (DEVICE)
    Newsletter.find({userId: payload.destinyUser})
        .select("-_id -userId -__v")
        .then(subs => {
            if (subs.length <= 0) return;
            const notificationPayload = {
                "notification": {
                    "title": payload.title,
                    "body": payload.text,
                    "icon": payload.userProfilePic,
                    "badge": 'https://storage.googleapis.com/feep/icons/iconSheep.png',
                    "vibrate": [100, 50, 100],
                    "actions": [
                        {"action": "default", "title": "Click view more details!"}
                    ],
                    "data": {
                        "dateOfArrival": Date.now(),
                        "primaryKey": 1,
                        "onActionClick": {
                            "default": {"operation": "openWindow", "url": payload.link}
                        }
                    }
                }
            };
            subs.forEach(sub =>{
                webpush.sendNotification(sub, JSON.stringify(notificationPayload))
                    .catch(err => {
                        // We drop the subscription if it's expired or incorrect
                        if(err.statusCode === 401 || err.statusCode === 404){
                            Newsletter.findOneAndDelete({
                              userId: payload.destinyUser,
                              endpoint: sub.endpoint,
                              keys: sub.keys
                            }).then(res => {
                                console.log(`Push API subscription dropped for user ${res.userId}`)
                            });
                        }
                    });
            });
        });
    notifToSave.save();
}

// Initialize the server
server.listen(process.env.PORT, ()=>{
    console.log(`Server listening on port ${process.env.PORT}`);
    swaggerDocs(app, process.env.PORT);
})

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
    'mailto:sergioferrerept@gmail.com',
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
        origins: ['http://localhost:4200']
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000
    }
})
io.on('connection', (socket)=>{

    console.log("a user has connected")

    const id = JSON.parse(socket.handshake.query.payload.toString())._id;
    let allow_notifications = false;

    // Find if user selected allow push notifications
    User.findById(id).select("allow_notifications").then(user =>{
        console.log(user)
       if(user.allow_notifications === -1){
           socket.emit("allow", null);
       } else if (user.allow_notifications === 1){
           allow_notifications = true;
       }
    });

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
        console.log("a User has disconnected");
        const index = connectedUsers.findIndex(user => user.id == id);
        connectedUsers.splice(index, 1);
    });

    socket.on('likedPost', (msg)=>{
        manageNotification(msg.payload, 'likedPost');
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
        manageNotification(msg.payload, 'likedComment');
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
        manageNotification(msg.payload, 'sendComment');
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
        manageNotification(msg.payload, 'followed');
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
        console.log("entro")
        notifToSave.text = "📷 Image"
    }

    // Send real-time notification to the user sockets (APP)
    const sockets = connectedUsers.filter(u => u.id == payload.destinyUser).map(r => r.socket);
    if(sockets.length > 0){
        sockets.forEach(s => s.emit("message", notifToSave));
    }

    // Search if the user allowed notifications to send by Push API (DEVICE)
    Newsletter.findOne({userId: payload.destinyUser})
        .select("-_id -userId")
        .then(sub => {
            if (sub != null){
                const notificationPayload = {
                    "notification": {
                        "title": payload.title,
                        "body": payload.text,
                        "icon": "assets/icons/icon-72x72.png",
                        "vibrate": [100, 50, 100],
                        "data": {
                            "dateOfArrival": Date.now(),
                            "primaryKey": 1
                        },
                        "actions": [{
                            "action": "explore",
                            "title": "Go to the site"
                        }]
                    }
                };
                webpush.sendNotification(sub, JSON.stringify(notificationPayload));
                console.log("enviado a: " + sub);
            }
        });
    notifToSave.save();
}

// Initialize the server
server.listen(process.env.PORT, ()=>{
    console.log(`Server listening on port ${process.env.PORT}`);
    swaggerDocs(app, process.env.PORT);
})

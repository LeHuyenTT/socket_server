require("dotenv").config();
const cluster = require("cluster");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
const Redis = require("ioredis");
const compression = require("compression");
const helmet = require("helmet");
const colors = require("colors");

const numCPUs = require("os").cpus().length;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = 'localhost';

// Tạo một Redis client cho các lệnh thông thường
const redisClient = new Redis(REDIS_HOST, REDIS_PORT);

// Tạo một Redis client khác dành riêng cho việc subscribe
const redisSubscriber = new Redis(REDIS_HOST, REDIS_PORT);

const DBConnection = require("./Apps/config/db");
DBConnection();

//require DB
require("./Apps/models/UserModel");
require("./Apps/models/AssignModel");
require("./Apps/models/AttendanceModel");
require("./Apps/models/ClassModel");
require("./Apps/models/DeviceModel");
require("./Apps/models/SubjectModel");
require("./Apps/models/QuetionModel");
require("./Apps/models/DocsModel");
require("./Apps/models/TranscriptModel");
require("./Apps/models/NotiModel");
require("./Apps/models/ClassRoomModel");
require("./Apps/models/StudentModel");

// init Express App
const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use((req, res, next) => {
    req.headers["api-token"] = "da8b3c7e1a0cb2";
    next();
});

app.use(compression());
app.use(helmet());

app.get("/", (req, res) => {
    res.send(`Welcome to the server! ${process.env.PORT}`);
});

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`.yellow);

    setupMaster(httpServer, {
        loadBalancingMethod: "least-connection",
    });

    setupPrimary();

    cluster.setupMaster({
        serialization: "advanced",
    });

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died`.red);
        cluster.fork();
    });
} else {
    httpServer.listen(process.env.PORT, () => {
        console.log(
            `Server is running ${process.env.NODE_ENV} mode on port ${process.env.PORT}`.yellow
        );
    });

    console.log(`Worker ${process.pid} started`.yellow);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
        transports: ["websocket"],
    });

    // Sử dụng Redis adapter
    io.adapter(createAdapter(redisClient));

    setupWorker(io);

    // socketio
    const { verifyToken } = require("./Apps/middlewares/auth")(io);
    const { handleDisconnect } = require("./Apps/room/commom")(io);
    const { setOnline, setIP } = require("./Apps/user/userCtrl")();
    const AssignModel = require("./Apps/models/AssignModel");
    const ClassModel = require("./Apps/models/ClassModel");

    io.use(verifyToken);

    function getNumUsersInRoom(room) {
        const roomSockets = io.sockets.adapter.rooms.get(room);
        const numUsers = roomSockets ? roomSockets.size : 0;
        return numUsers;
    }

    io.on("connection", (socket) => {
        console.log(`Client with id: ${socket.deviceId} connected to server`.yellow);
        setOnline(socket.handshake.query.token);
        //setIP(socket, socket.handshake.query.token);
        //io.emit("clientStatus", { clientId: socket.deviceId });

        const StudentModel = require("./Apps/models/StudentModel");
        const NotiModel = require("./Apps/models/NotiModel");

        // redisSubscriber.subscribe('checkin:data', (err, count) => {
        //     if (err) {
        //         console.error('Failed to subscribe to Redis channel:', err);
        //     } else {
        //         console.log(`Subscribed to Redis channel: checkin:data. Count: ${count}`);
        //     }
        // });
        // // Lắng nghe sự kiện checkin từ Redis
        // redisSubscriber.on('message', (channel, message) => {
        //     console.log(`Received checkin data from Redis: ${message}`);
        //     io.emit('checkin:response', JSON.parse(message));
        // });

        socket.on("notifications", async (data) => {
            const [userId, content] = data.split("_");
        
            //Kiểm tra cache trước
            let userCache = await redisClient.get(`user:${userId}`);
            let userIdValue;
        
            if (userCache) {
                userIdValue = userCache;
                console.log("Had in cache");
            } 
            else {
                // Nếu không có trong cache, truy vấn database
                console.log("Don't have in cache");
                const us = await StudentModel.findOne({ userID: userId });
                if (us) {
                    userIdValue = us._id;
                    // Lưu kết quả vào cache với TTL 1 giờ (3600 giây)
                    await redisClient.set(`user:${userId}`, userIdValue, 'EX', 3600);
                } else {
                    console.log(`User with ID ${userId} not found`);
                    return;
                }
            }
        
            const notiTemp = {
                content: content,
                timing: new Date().toISOString(),
                url_icon: "../Resources/icon/add-user.png",
                isRead: false,
            };
        
            // Kiểm tra cache thông báo trước
            let docsCache = await redisClient.get(`notifications:${userId}`);
        
            if (docsCache) {
                await NotiModel.updateOne({ user: userIdValue }, { $push: { noti: notiTemp } });
                console.log("HAVING: Notification updated successfully");
            } 
            else {
                // Nếu không có trong cache, truy vấn database
                console.log("Don't have noti in cache");
                docs = await NotiModel.findOne({ user: userIdValue });
                if (!docs) {
                    const newNoti = new NotiModel({
                        user: userIdValue,
                        noti: [notiTemp],
                    });
                    await newNoti.save();
                }
                await NotiModel.updateOne({ user: userIdValue }, { $push: { noti: notiTemp } });
                console.log("DON'T: Notification updated successfully");
                await redisClient.set(`notifications:${userId}`, userIdValue, 'EX', 3600);
            }
        
            const topic = `response`;
            io.emit(topic, content);
        });

        socket.on("classroom:connected", (data) => {
            [classid, userid] = data.split("_");
            socket.classid = classid;
            topic = `${classid}:connected`;
            io.emit(topic, userid);
        });

        socket.on("cheating", async (data) => {
            console.log(data);
            [classid, nameAssign, msg] = data.split("_");
            topic = `${classid}:${nameAssign}:cheating`;
            console.log(topic);
            topic = `${classid}:${nameAssign}:cheating`;
            let assign = await AssignModel.findOne({ idAssign: nameAssign });
            [content, type] = msg.split(":");
            assign["logs"].push({ content: content, type: type });
            await assign.save();
            io.emit(topic, msg);
        });

        socket.on("assign:finished", async (data) => {
            const assign = await AssignModel.findOne({ nameAssign: data });
            assign["doned"] = true;
            await assign.save();
        });

        socket.on("tools:emit", (data) => {
            [channel, content] = data.split("_");
            io.emit(channel, content);
        });

        socket.on("test:stress", (data) => {
            console.log(getNumUsersInRoom(data));
            socket.join(data);
            console.log(getNumUsersInRoom(data));
        });

        socket.on("noti:status", async (data) => {
            console.log(data);
            [userid, classid, type] = data.split("_");
            topic = `${classid}:status`;
            content = `${userid}_${type}`;
            if (type == "joinclass") {
                _user = await StudentModel.findOne({ userID: userid });
                _user["inClass"] = "online";
                await _user.save();
            } else if (type == "leaveclass") {
                _user = await StudentModel.findOne({ userID: userid });
                _user["inClass"] = "offline";
                await _user.save();
            }
            io.emit(topic, content);
        });

        socket.on("emitToRoom", (data) => {
            const delay = Date.now() - data.timestamp; // Calculate the time delay
            console.log(`Time delay to emit to room: ${delay}ms`);

            let msg = {
                statTime: data.timestamp,
                timeDelayAtServer: delay,
                numuserinroom: getNumUsersInRoom(data.room),
            };
            console.log(msg);
            io.to(data.room).emit("room:testing:back", { message: msg });
        });

        socket.on("noti:activate", (data) => {
            [userid, classid, device] = data.split("_");
            socket.classid = classid;
            if (device == "web") {
                device = socket.handshake.address.address;
            }
            msgActivate = `${userid}_${device}`;
            topic = `${classid}:activate`;
            io.emit(topic, msgActivate);
        });

        socket.on("noti:assign:start", async (data) => {
            [idClass, idAssign] = data.split("_");
            __class = await ClassModel.findOne({ classID: idClass }).populate(
                "members"
            );
            listIdStudent = [];
            temp = {};
            for (let i = 0; i < __class.members.length; i++) {
                if (__class.members[i].role == "student") {
                    listIdStudent.push(__class.members[i].username);
                }
            }

            for (let idx = 0; idx < listIdStudent.length; idx++) {
                topic = `${idClass}:${listIdStudent[idx]}:assign:start`;
                io.emit(topic, idAssign);
            }
        });
        socket.on("noti:docs:started", async (data) => {
            [idClass, idAssign] = data.split("_");
            __class = await ClassModel.findOne({ classID: idClass }).populate(
                "members"
            );
            listIdStudent = [];
            temp = {};
            for (let i = 0; i < __class.members.length; i++) {
                if (__class.members[i].role == "student") {
                    listIdStudent.push(__class.members[i].username);
                }
            }

            for (let idx = 0; idx < listIdStudent.length; idx++) {
                topic = `${idClass}:${listIdStudent[idx]}:doc:start`;
                io.emit(topic, idAssign);
            }
        });

        socket.on("noti:docs:stoped", async (data) => {
            [idClass, idAssign] = data.split("_");
            __class = await ClassModel.findOne({ classID: idClass }).populate(
                "members"
            );
            listIdStudent = [];
            temp = {};
            for (let i = 0; i < __class.members.length; i++) {
                if (__class.members[i].role == "student") {
                    listIdStudent.push(__class.members[i].username);
                }
            }

            for (let idx = 0; idx < listIdStudent.length; idx++) {
                topic = `${idClass}:${listIdStudent[idx]}:doc:stop`;
                io.emit(topic, idAssign);
            }
        });

        socket.on("assign:ctrl", async (data) => {
            try {
                [assignid, type] = data.split("_");
                topic = `${assignid}:ctrl`;
                console.log(topic + " " + type);
                io.emit(topic, type);
            } catch (err) {
                console.log(err);
            }
        });

        socket.on("disconnect", handleDisconnect);
    });
}

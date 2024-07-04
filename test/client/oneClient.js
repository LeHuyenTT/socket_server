const { io } = require("socket.io-client");

const userId = "20520001_student"; // Thay thế bằng ID của người dùng bạn muốn sử dụng
const token = userId; // Trong trường hợp này, chúng ta sẽ sử dụng ID của người dùng làm token

// const userId1 = "20520011"; // Thay thế bằng ID của người dùng bạn muốn sử dụng
// const token1 = userId1;

const socket = io("http://127.0.0.1:4026", {
  query: {
    token: token
  },
  transports: ["websocket"]
});
// const socket2 = io("http://127.0.0.1:4027", {
//   query: {
//     token: token1
//   },
//   transports: ["websocket"]
// });

// socket1.emit('checkin', { token });

// socket2.on('checkin:response', (data) => {
//   console.log(`Received checkin response from Server 1: ${data}`);
// });

socket.on("connect", () => {
  console.log("Client connected to server");
  // socket.emit("noti:status", `${userId}_MATH101_Class`);
});

socket.on("disconnect", () => {
  console.log("Client disconnected from server");
});

socket.on("response", (data) => {
  console.log("Received notification:", data);
});

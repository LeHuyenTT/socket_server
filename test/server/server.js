const io = require("socket.io-client");

const token = "20521422";

// Thay đổi địa chỉ và cổng tương ứng với máy chủ của bạn
const socket = io("http://127.0.0.1:4025", {
  query: {
    token: token
  },
  transports: ["websocket"]
});

// Bắt sự kiện "connect" khi kết nối thành công
socket.on("connect", () => {
    console.log("Connected to server");
});

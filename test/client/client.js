const { io } = require("socket.io-client");

const users = ["20520001", "20520002", "20520003", "20520004", "20520005", "20520006", "20520007", "20520008", "20520009", "20520010", "20520011", "20520012", "20520013", "20520014", "20520015", "20520016", "20520017", "20520018", "20520019", "20520020", "20520021", "20520022", "20520023", "20520024", "20520025", "20520026", "20520027", "20520028", "20520029", "20520030", "20520031", "20520032", "20520033", "20520034", "20520035", "20520036", "20520037", "20520038", "20520039", "20520040", "20520041", "20520042", "20520043", "20520044", "20520045", "20520046", "20520047", "20520048", "20520049", "20520050", "20520051", "20520052", "20520053", "20520054", "20520055", "20520056", "20520057", "20520058", "20520059", "20520060", "20520061", "20520062", "20520063", "20520064", "20520065", "20520066", "20520067", "20520068", "20520069", "20520070", "20520071", "20520072", "20520073", "20520074", "20520075", "20520076", "20520077", "20520078", "20520079", "20520080", "20520081", "20520082", "20520083", "20520084", "20520085", "20520086", "20520087", "20520088", "20520089", "20520090", "20520091", "20520092", "20520093", "20520094", "20520095", "20520096", "20520097", "20520098", "20520099"];

const MAX_CLIENTS = 100;
const EMIT_INTERVAL_IN_MS = 1000;

let clientCount = 0;
let lastReport = new Date().getTime();
let packetsSinceLastReport = 0;
let delays = [];

const createClient = (userId) => {
  const socket = io("http://127.0.0.1:4025", {
    query: {
      token: userId
    },
    transports: ["websocket"]
  });

  return new Promise((resolve, reject) => {
    socket.on("connect_error", (error) => {
      reject(error);
    });

    socket.on("connect_timeout", () => {
      reject(new Error("Connection timeout"));
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected with id: ${userId}`);
    });

    socket.on("connect", () => {
      console.log(`Client connected with id: ${userId}`);
      resolve(socket);
    });

    socket.on("response", (data) => {
      const now = new Date().getTime();
      const delay = now - data.timestamp;
      delays.push(delay);
    });
  });
};

const emitNotifications = (socket, userId) => {
  return new Promise((resolve, reject) => {
    users.forEach(userId => {
      socket.emit("notifications", { data: `${userId}_${userId} notify`, timestamp: new Date().getTime() });
    });

    resolve();
  });
};

const createClientsAndEmit = async () => {
  const sockets = [];
  try {
    // Tạo tất cả các client và chờ cho đến khi tất cả đều kết nối thành công
    for (let i = 0; i < MAX_CLIENTS; i++) {
      const userId = users[i % users.length]; // Chọn userId từ danh sách
      const socket = await createClient(userId);
      sockets.push(socket);
    }

    // Emit notifications sau khi tất cả client đã kết nối thành công
    await Promise.all(sockets.map(socket => emitNotifications(socket)));

    console.log("All clients are connected and notifications are emitted.");

    // Tính toán và vẽ biểu đồ độ trễ
    //drawDelayChart();
  } catch (error) {
    console.error("Error while connecting clients:", error);
  }
};

// const drawDelayChart = () => {
//   // Vẽ biểu đồ độ trễ
//   const Canvas = require('canvas');
//   const fs = require('fs');

//   const canvas = Canvas.createCanvas(800, 600);
//   const ctx = canvas.getContext('2d');

//   // Xử lý dữ liệu độ trễ
//   const sortedDelays = delays.sort((a, b) => a - b);
//   const maxDelay = sortedDelays[sortedDelays.length - 1];
//   const minDelay = sortedDelays[0];

//   const binWidth = 10;
//   const numBins = Math.ceil((maxDelay - minDelay) / binWidth);

//   const delayCounts = new Array(numBins).fill(0);
//   sortedDelays.forEach(delay => {
//     const binIndex = Math.floor((delay - minDelay) / binWidth);
//     delayCounts[binIndex]++;
//   });

//   const maxCount = Math.max(...delayCounts);

//   // Vẽ histogram
//   const barWidth = 5;
//   const barSpacing = 2;
//   const xScale = 800 / numBins;
//   const yScale = 500 / maxCount;

//   ctx.fillStyle = 'lightblue';
//   delayCounts.forEach((count, index) => {
//     const x = index * xScale;
//     const barHeight = count * yScale;
//     const y = 600 - barHeight;
//     ctx.fillRect(x, y, barWidth, barHeight);
//   });

//   // Lưu biểu đồ vào file
//   const out = fs.createWriteStream(__dirname + '/delay_histogram.png');
//   const stream = canvas.createPNGStream();
//   stream.pipe(out);
//   out.on('finish', () => console.log('The PNG file was created.'));
// };

createClientsAndEmit();

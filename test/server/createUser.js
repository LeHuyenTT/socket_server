const fs = require('fs');

// Tạo dữ liệu mẫu cho 100 người dùng
const users = [];
for (let i = 0; i < 900; i++) {
  const userID = (20520100 + i).toString();
  const user = {
    class: [],
    faces: [],
    status: "offline",
    topics: [userID],
    username: userID,
    password: userID,
    fullname: `Fullname ${i + 1}`,
    school: "UIT",
    userID: userID,
    email: `${userID}@gm.uit.edu.vn`,
    dayOfBirth: "2002-01-17",
    phoneNumber: `0333480${String(i).padStart(3, '0')}`,
    avatar: `https://ik.imagekit.io/duongtt/smartclass/${userID}.jpg`,
    inClass: "offline",
    role: "student",
    ip: "171.239.130.67",
    __v: 0,
    deviceLogin: "offline"
  };
  users.push(user);
}

// Lưu dữ liệu vào file JSON
const filename = 'Users.json';
fs.writeFileSync(filename, JSON.stringify(users, null, 2), 'utf-8');

console.log(`File ${filename} đã được tạo thành công.`);

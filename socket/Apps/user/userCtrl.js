const UserModel = require("../models/UserModel");
const StudentModel = require("../models/StudentModel");
const axios = require("axios")

module.exports = () => {
    const setOnline = async function (token) {
        try {
            // Tách userId và role từ token
            const [userId, role] = token.split('_');
    
            // Kiểm tra role và cập nhật trạng thái tương ứng
            const updateFields = { status: 'online' };
    
            if (role === 'student') {
                await StudentModel.updateOne({ userID: userId }, { $set: updateFields });
                console.log(`Updated student ${userId} to online status`);
            } else if (role === 'teacher') {
                await UserModel.updateOne({ userID: userId }, { $set: updateFields });
                console.log(`Updated teacher ${userId} to online status`);
            } else {
                console.log(`Role ${role} is not recognized`);
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const setIP = async function (socket, token) {
        const [userId, role] = token.split('_');
        const updateFields = {};
        __reponse = await axios.default.get("https://ipinfo.io/json");
        //console.log(__reponse.data)
        updateFields["ip"] = __reponse.data.ip;
        socket.userip = __reponse.data.ip;
        if (role === 'student') {
            await StudentModel.updateOne({ username: userId }, { $set: updateFields });
            console.log(`Updated Ip ${__reponse.data.ip} for student ${userId} `);
        }
        else if ( role === 'teacher') {
            await UserModel.updateOne({ username: userId }, { $set: updateFields });
            console.log(`Updated Ip ${__reponse.data.ip} for teacher ${userId} `);
        }
        else {
            console.log(`Role ${role} is not recognized`);
        }
    };

    const setOffline = async function (token) {
        const [userId, role] = token.split('_');
    
        // Kiểm tra role và cập nhật trạng thái tương ứng
        const updateFields = {};
        updateFields["status"] = "offline";
        updateFields["deviceLogin"] = "offline";
        updateFields["inClass"] = "offline";

        if (role === 'student') {
            await StudentModel.updateOne({ userID: userId }, { $set: updateFields });
            console.log(`Updated student ${userId} to offline status`);
        } else if (role === 'teacher') {
            await UserModel.updateOne({ userID: userId }, { $set: updateFields });
            console.log(`Updated teacher ${userId} to offline status`);
        } else {
            console.log(`Role ${role} is not recognized`);
        }
    };

    return {
        setOnline,
        setOffline,
        setIP
    }
}
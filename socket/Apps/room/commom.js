require('colors')

const { setOnline, setOffline } = require("../user/userCtrl")();

module.exports = (io) => {
    const handleDisconnect = function (payload) {
        const socket = this;
        setOffline(socket.handshake.query.token);
        msgLogout = `${socket.deviceId}_offline`
        msgLeaveClass = `${socket.deviceId}_leaveclass`
        // console.log(`${socket.classid}:activate`)
        // console.log(msgLogout)
        io.emit(`${socket.classid}:activate`, msgLogout);
        io.emit(`${socket.classid}:status`, msgLeaveClass);
        const [userid, content] = socket.deviceId.split("_");
        msgActivate = `${userid}_offline`;
        topic = "logout:inactivate";
        io.emit(topic, msgActivate);
        console.log(
            `Client with id: ${socket.deviceId} disconnect to server`.yellow.bold
        );
        socket.leave("room:testing")
    };

    return {
        handleDisconnect,
    }
}
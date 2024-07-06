module.exports = (io) => {
    const verifyToken = (socket, next) => {
        const token = socket.handshake.query.token;
        const [userId, role] = token.split('_');
        try {
            topics = {
                "device": userId,
            }
            socket.deviceId = token;
            next();
        } catch (error) {
            console.error(`Error authenticating user: ${error.message}`);
            next(new Error('Authentication error'));
        }
    }

    return {
        verifyToken,
    }
}


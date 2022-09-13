const { validateUniqueAccessToken } = require("../utils/validator");

function isValidUser(socket) {
    try {
        const access_token = socket.handshake.auth.token;
        // console.log(access_token);
        if (!access_token) {
            // console.log("invalid from 1")
            return false;
        }
        if (validateUniqueAccessToken(access_token)) {
            return true;
        } else {
            // console.log("invalid from 2")
            return false;
        }
    } catch (error) {
        console.log("Err from: utils.socket > validator > isValidUser > try: ", error.message)
        return false;
    }
}

module.exports = {
    isValidUser
}
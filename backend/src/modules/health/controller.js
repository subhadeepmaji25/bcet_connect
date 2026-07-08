// backend/src/modules/health/controller.js

const {

    getHealthStatus

} = require("./service");

const sendResponse = require(
    "../../shared/response/sendResponse"
);

const healthController =
(req, res) => {

    const health =
        getHealthStatus();

    return sendResponse(res, {

        message:
            "Application is healthy",

        data:
            health

    });

};

module.exports = {

    healthController

};
// backend/src/modules/health/service.js

/*
|--------------------------------------------------------------------------
| Health Service
|--------------------------------------------------------------------------
|
| Returns application health information.
|
*/

const mongoose = require("mongoose");

const { app } = require("../../../config");

const getHealthStatus = () => {

    const dbState = mongoose.connection.readyState;

    const database = {

        connected: dbState === 1,

        state:
            dbState === 0
                ? "disconnected"
                : dbState === 1
                ? "connected"
                : dbState === 2
                ? "connecting"
                : "disconnecting"

    };

    return {

        application: {

            name: app.name,

            version: app.version,

            environment: app.environment

        },

        server: {

            uptime:
                Math.floor(process.uptime()),

            nodeVersion:
                process.version,

            platform:
                process.platform,

            memory: process.memoryUsage()

        },

        database,

        timestamp:
            new Date().toISOString()

    };

};

module.exports = {

    getHealthStatus

};
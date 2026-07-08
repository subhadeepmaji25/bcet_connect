// backend/config/app.js

/*
|--------------------------------------------------------------------------
| Application Configuration
|--------------------------------------------------------------------------
|
| Central application configuration.
|
| Responsibilities:
| • Application Information
| • Environment
| • API Configuration
| • Security
| • CORS
| • Request Limits
| • Logging
|
| This file MUST NOT contain any business logic.
|
*/

const env = require("./env");

const appConfig = Object.freeze({

    /*
    |--------------------------------------------------------------------------
    | Application
    |--------------------------------------------------------------------------
    */

    name: "BCET Connect",

    description:
        "Career Ecosystem for Students, Faculty and Alumni",

    version: "1.0.0",

    environment: env.app.nodeEnv,

    port: env.app.port,

    isDevelopment:
        env.app.nodeEnv === "development",

    isProduction:
        env.app.nodeEnv === "production",

    isTest:
        env.app.nodeEnv === "test",

    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

    api: {

        prefix: "/api",

        version: "v1"

    },

    /*
    |--------------------------------------------------------------------------
    | Express
    |--------------------------------------------------------------------------
    */

    express: {

        trustProxy: env.app.nodeEnv === "production" ? 1 : false,

        hidePoweredBy: true

    },

    /*
    |--------------------------------------------------------------------------
    | CORS
    |--------------------------------------------------------------------------
    */

    cors: {

        origin:
            process.env.CORS_ORIGIN ||
            process.env.FRONTEND_URL ||
            "http://localhost:5173",

        credentials: true

    },

    /*
    |--------------------------------------------------------------------------
    | Request Limits
    |--------------------------------------------------------------------------
    */

    limits: {

        json: "2mb",

        urlencoded: "2mb"

    },

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    */

    logging: {

        enabled: true,

        format:
            env.app.nodeEnv === "development"
                ? "dev"
                : "combined"

    },

    /*
    |--------------------------------------------------------------------------
    | Health Module
    |--------------------------------------------------------------------------
    */

    health: {

        enabled: true,

        detailsEnabled: true

    },

    /*
    |--------------------------------------------------------------------------
    | Future Modules
    |--------------------------------------------------------------------------
    */

    features: {

        recommendation: true,

        mentorship: true,

        communities: true,

        events: true,

        feed: true,

        chat: true,

        ai: false

    }

});

module.exports = appConfig;
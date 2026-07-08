// backend/src/modules/health/route.js

const express = require("express");

const router =
    express.Router();

const {

    healthController

} = require("./controller");
router.get(
    "/",
    healthController
);

module.exports =
    router;
// backend/src/config/database.js

const mongoose = require("mongoose");

let isConnected = false;
let eventsRegistered = false;

const registerDatabaseEvents = () => {
    if (eventsRegistered) return;

    mongoose.connection.on("connected", () => {
        console.log("🟢 MongoDB Connected");
    });

    mongoose.connection.on("open", () => {
        console.log("✅ Database Connection Open");
    });

    mongoose.connection.on("reconnected", () => {
        console.log("🔄 MongoDB Reconnected");
        isConnected = true;
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("🟡 MongoDB Disconnected");
        isConnected = false;
    });

    mongoose.connection.on("error", (err) => {
        console.error("🔴 MongoDB Error:", err.message);
    });

    eventsRegistered = true;
};

const connectDB = async () => {
    try {

        if (isConnected) {
            console.log("⚡ Using Existing MongoDB Connection");
            return mongoose.connection;
        }

        registerDatabaseEvents();

        mongoose.set("strictQuery", true);

        const connection = await mongoose.connect(process.env.MONGO_URI, {

            autoIndex: process.env.NODE_ENV !== "production",

            maxPoolSize: 20,

            minPoolSize: 5,

            serverSelectionTimeoutMS: 10000,

            socketTimeoutMS: 45000,

            family: 4,

            heartbeatFrequencyMS: 10000,

            connectTimeoutMS: 10000,

            retryReads: true

        });

        isConnected = true;

        console.log("----------------------------------------");
        console.log("✅ MongoDB Successfully Connected");
        console.log("Host :", connection.connection.host);
        console.log("Database :", connection.connection.name);
        console.log("Ready State :", connection.connection.readyState);
        console.log("----------------------------------------");

        return connection;

    } catch (error) {

        isConnected = false;

        console.error("\n❌ MongoDB Connection Failed\n");
        console.error(error);

        process.exit(1);
    }
};

const closeDB = async () => {

    try {

        if (mongoose.connection.readyState !== 0) {

            await mongoose.connection.close();

            isConnected = false;

            console.log("🛑 MongoDB Connection Closed");

        }

    } catch (error) {

        console.error("❌ Error Closing MongoDB");

        console.error(error.message);

    }

};

const registerShutdownHandlers = () => {

    process.once("SIGINT", async () => {

        console.log("\nSIGINT Received");

        await closeDB();

        process.exit(0);

    });

    process.once("SIGTERM", async () => {

        console.log("\nSIGTERM Received");

        await closeDB();

        process.exit(0);

    });

    process.once("SIGUSR2", async () => {

        await closeDB();

        process.kill(process.pid, "SIGUSR2");

    });

};

registerShutdownHandlers();

module.exports = {
    connectDB,
    closeDB
};
// backend/src/core/server.js
const http=require("http");
const bootstrap=require("./bootstrap");
const{app:appConfig}=require("../../config");
const logger=require("../shared/logger/logger");
const{closeDB}=require("../../config/database");
const startServer=async()=>{
try{
const app=await bootstrap();
const server=http.createServer(app);
server.listen(appConfig.port,()=>{
logger.success(`${appConfig.name} is running`);
logger.info(`Environment : ${appConfig.environment}`);
logger.info(`Port : ${appConfig.port}`);
logger.info(`URL : http://localhost:${appConfig.port}`);
});
server.on("error",error=>{
logger.error("HTTP Server Error",error);
process.exit(1);
});
const shutdown=async signal=>{
logger.warn(`${signal} received. Shutting down...`);
server.close(async()=>{
try{
await closeDB();
logger.success("HTTP Server Closed");
process.exit(0);
}catch(error){
logger.error("Shutdown Failed",error);
process.exit(1);
}
});
};
process.on("SIGINT",()=>shutdown("SIGINT"));
process.on("SIGTERM",()=>shutdown("SIGTERM"));
}catch(error){
logger.error("Application Startup Failed",error);
process.exit(1);
}
};
process.on("unhandledRejection",error=>{
logger.error("Unhandled Promise Rejection",error);
process.exit(1);
});
process.on("uncaughtException",error=>{
logger.error("Uncaught Exception",error);
process.exit(1);
});
startServer();
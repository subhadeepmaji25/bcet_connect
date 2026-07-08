// backend/src/core/app.js
const express=require("express");
const cors=require("cors");
const helmet=require("helmet");
const compression=require("compression");
const morgan=require("morgan");
const{app:appConfig}=require("../../config");
const registerRoutes=require("../routes");
const errorHandler=require("../shared/errors/errorHandler");
const ApiError=require("../shared/errors/ApiError");
const createApp=()=>{
const app=express();
app.disable("x-powered-by");
app.set("trust proxy",appConfig.express.trustProxy);
app.use(helmet());
app.use(cors({
origin:appConfig.cors.origin,
credentials:appConfig.cors.credentials
}));
app.use(compression());
app.use(express.json({
limit:appConfig.limits.json
}));
app.use(express.urlencoded({
extended:true,
limit:appConfig.limits.urlencoded
}));
if(appConfig.logging.enabled){
app.use(morgan(appConfig.logging.format));
}
registerRoutes(app);
app.use((req,res,next)=>{
next(new ApiError(
404,
`Route Not Found : ${req.originalUrl}`
));
});
app.use(errorHandler);
return app;
};
module.exports=createApp;
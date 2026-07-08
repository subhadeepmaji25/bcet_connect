// backend/src/shared/errors/errorHandler.js
const ApiError=require("./ApiError");
const logger=require("../logger/logger");
const{app:appConfig}=require("../../../config");

const errorHandler=(error,req,res,next)=>{
let apiError=error;

if(!(apiError instanceof ApiError)){
if(error.name==="MongoServerError"&&error.code===11000){
apiError=ApiError.conflict("Duplicate value found");
}else if(error.name==="ValidationError"){
apiError=ApiError.validation(
"Validation Failed",
Object.values(error.errors).map(item=>item.message)
);
}else if(error.name==="CastError"){
apiError=ApiError.badRequest("Invalid resource id");
}else if(error.name==="JsonWebTokenError"){
apiError=ApiError.unauthorized("Invalid token");
}else if(error.name==="TokenExpiredError"){
apiError=ApiError.unauthorized("Token expired");
}else{
apiError=ApiError.internal(error.message);
}
}

logger.error(apiError.message,error);

return res.status(apiError.statusCode).json({
success:false,
message:apiError.message,
errors:apiError.errors,
stack:appConfig.environment==="development"?error.stack:undefined
});
};

module.exports=errorHandler;
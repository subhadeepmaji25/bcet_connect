// backend/src/shared/errors/ApiError.js
class ApiError extends Error{
constructor(statusCode=500,message="Internal Server Error",errors=[],isOperational=true){
super(message);
this.name=this.constructor.name;
this.statusCode=statusCode;
this.success=false;
this.errors=Array.isArray(errors)?errors:[errors];
this.isOperational=isOperational;
Error.captureStackTrace(this,this.constructor);
}

static badRequest(message="Bad Request",errors=[]){
return new ApiError(400,message,errors);
}

static unauthorized(message="Unauthorized"){
return new ApiError(401,message);
}

static forbidden(message="Forbidden"){
return new ApiError(403,message);
}

static notFound(message="Resource Not Found"){
return new ApiError(404,message);
}

static conflict(message="Conflict"){
return new ApiError(409,message);
}

static validation(message="Validation Failed",errors=[]){
return new ApiError(422,message,errors);
}

static internal(message="Internal Server Error"){
return new ApiError(500,message);
}
}

module.exports=ApiError;
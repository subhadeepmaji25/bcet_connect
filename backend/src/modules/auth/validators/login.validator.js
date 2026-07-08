//backend/src/modules/auth/validators/login.validator.js
const ApiError=require("../../../shared/errors/ApiError");

const loginValidator=(req,res,next)=>{
const{identifier,password}=req.body;

if(typeof identifier!=="string"||!identifier.trim()){
return next(new ApiError(400,"Identifier is required"));
}

if(typeof password!=="string"||!password.trim()){
return next(new ApiError(400,"Password is required"));
}

req.body.identifier=identifier.trim();
req.body.password=password;

next();
};

module.exports={
loginValidator
};
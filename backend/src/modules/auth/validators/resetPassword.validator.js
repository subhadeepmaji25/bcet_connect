//backend/src/modules/auth/validators/resetPassword.validator.js
const ApiError=require("../../../shared/errors/ApiError");

const resetPasswordValidator=(req,res,next)=>{
let{
identifier,
resetSecret,
newPassword
}=req.body;

if(typeof identifier!=="string"||!identifier.trim()){
return next(new ApiError(400,"Identifier is required"));
}

if(typeof resetSecret!=="string"||!resetSecret.trim()){
return next(new ApiError(400,"Reset secret is required"));
}

if(typeof newPassword!=="string"||!newPassword.trim()){
return next(new ApiError(400,"New password is required"));
}

identifier=identifier.trim();
resetSecret=resetSecret.trim();
newPassword=newPassword.trim();

req.body={
identifier,
resetSecret,
newPassword
};

next();
};

module.exports={
resetPasswordValidator
};
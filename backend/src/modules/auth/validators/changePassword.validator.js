//backend/src/modules/auth/validators/changePassword.validator.js
const ApiError=require("../../../shared/errors/ApiError");

const changePasswordValidator=(req,res,next)=>{
let{
oldPassword,
newPassword
}=req.body;

if(typeof oldPassword!=="string"||!oldPassword.trim()){
return next(new ApiError(400,"Old password is required"));
}

if(typeof newPassword!=="string"||!newPassword.trim()){
return next(new ApiError(400,"New password is required"));
}

oldPassword=oldPassword.trim();
newPassword=newPassword.trim();

if(oldPassword===newPassword){
return next(new ApiError(400,"New password must be different from current password"));
}

req.body={
oldPassword,
newPassword
};

next();
};

module.exports={
changePasswordValidator
};
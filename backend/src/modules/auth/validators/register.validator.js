//backend/src/modules/auth/validators/register.validator.js
const ApiError=require("../../../shared/errors/ApiError");

const ALLOWED_ROLES=[
"student",
"faculty",
"alumni"
];

const USERNAME_REGEX=/^[a-z0-9._]{3,30}$/;
const EMAIL_REGEX=/^\S+@\S+\.\S+$/;

const registerValidator=(req,res,next)=>{
let{
role,
username,
email,
password,
identityId,
fullName
}=req.body;

if(typeof role!=="string"){
return next(new ApiError(400,"Role is required"));
}

role=role.trim().toLowerCase();

if(!ALLOWED_ROLES.includes(role)){
return next(new ApiError(400,"Invalid role"));
}

if(typeof username!=="string"||!username.trim()){
return next(new ApiError(400,"Username is required"));
}

username=username.trim().toLowerCase();

if(!USERNAME_REGEX.test(username)){
return next(new ApiError(400,"Invalid username"));
}

if(typeof email!=="string"||!email.trim()){
return next(new ApiError(400,"Email is required"));
}

email=email.trim().toLowerCase();

if(!EMAIL_REGEX.test(email)){
return next(new ApiError(400,"Invalid email address"));
}

if(typeof password!=="string"||!password.trim()){
return next(new ApiError(400,"Password is required"));
}

if(typeof fullName!=="string"||!fullName.trim()){
return next(new ApiError(400,"Full name is required"));
}

fullName=fullName.trim();

if(identityId!==undefined&&identityId!==null){
if(typeof identityId!=="string"){
return next(new ApiError(400,"Invalid identity ID"));
}
identityId=identityId.trim().toUpperCase();
}

req.body={
role,
username,
email,
password,
identityId:identityId||null,
fullName
};

next();
};

module.exports={
registerValidator
};

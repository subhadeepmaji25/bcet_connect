// backend/src/modules/auth/services/login.service.js
const jwt=require("jsonwebtoken");
const User=require("../models/User");
const ApiError=require("../../../shared/errors/ApiError");

const generateAccessToken=user=>{
return jwt.sign(
{
id:user._id,
role:user.role,
username:user.username,
tokenVersion:user.tokenVersion||0
},
process.env.JWT_SECRET,
{
expiresIn:process.env.JWT_EXPIRES_IN||"7d"
}
);
};

const loginUser=async({
identifier,
password
})=>{
if(!identifier||!password){
throw ApiError.badRequest("Identifier and password are required");
}

const user=await User.findByIdentifier(identifier);

if(!user){
throw ApiError.unauthorized("Invalid credentials");
}

if(user.isDeleted){
throw ApiError.unauthorized("Account no longer available");
}

if(user.accountStatus==="suspended"){
throw ApiError.forbidden("Account suspended. Contact administrator.");
}

if(user.accountStatus==="rejected"){
throw ApiError.forbidden("Account rejected.");
}

if(user.accountStatus==="pending"){
throw ApiError.forbidden("Account verification pending.");
}

if(user.isLocked()){
throw ApiError.forbidden("Account temporarily locked. Try again later.");
}

const isPasswordValid=await user.comparePassword(password);

if(!isPasswordValid){
await user.markLoginFailure();
throw ApiError.unauthorized("Invalid credentials");
}

await user.markLoginSuccess();

const accessToken=generateAccessToken(user);

return{
success:true,
message:"Login successful",
data:{
accessToken,
user:{
id:user._id,
role:user.role,
username:user.username,
email:user.email,
identityId:user.identityId,
accountStatus:user.accountStatus,
emailVerified:user.emailVerified,
profileCreated:user.profileCreated,
tokenVersion:user.tokenVersion||0
}
}
};
};

module.exports={
loginUser,
generateAccessToken
};

// backend/src/modules/auth/services/resetPassword.service.js
const User=require("../models/User");
const validatePassword=require("../../../shared/utils/passwordValidator");

const resetPassword=async({
identifier,
resetSecret,
newPassword
})=>{
if(!identifier||!resetSecret||!newPassword){
throw new Error("Identifier, reset secret and new password are required");
}

if(resetSecret!==process.env.PASSWORD_RESET_SECRET){
throw new Error("Invalid reset secret");
}

validatePassword(newPassword);

const user=await User.findByIdentifier(identifier);

if(!user){
throw new Error("User not found");
}

if(user.isDeleted){
throw new Error("Account no longer available");
}

if(user.accountStatus==="suspended"){
throw new Error("Account suspended");
}

if(user.accountStatus==="rejected"){
throw new Error("Account rejected");
}

const isSamePassword=await user.comparePassword(newPassword);

if(isSamePassword){
throw new Error("New password must be different from current password");
}

await user.setPassword(newPassword);

user.loginAttempts=0;
user.lockUntil=null;
user.lastSeenAt=new Date();

await user.invalidateSessions();

return{
success:true,
message:"Password reset successful. Please login again.",
data:{
userId:user._id,
username:user.username,
tokenVersion:user.tokenVersion
}
};
};

module.exports={resetPassword};
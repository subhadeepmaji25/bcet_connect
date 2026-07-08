// backend/src/modules/auth/services/logout.service.js
const User=require("../models/User");
const ApiError=require("../../../shared/errors/ApiError");

const logoutUser=async(userId)=>{
if(!userId){
throw ApiError.badRequest("User ID is required");
}

const user=await User.findById(userId);

if(!user){
throw ApiError.notFound("User not found");
}

if(user.isDeleted){
throw ApiError.unauthorized("Account no longer available");
}

await user.invalidateSessions();

user.lastSeenAt=new Date();

await user.save();

return{
success:true,
message:"Logout successful",
data:{
userId:user._id,
tokenVersion:user.tokenVersion
}
};
};

module.exports={logoutUser};

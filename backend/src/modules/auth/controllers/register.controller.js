//backend/src/modules/controllers/register.controller.js
const {registerUser}=require("../services/register.service");
const sendResponse=require("../../../shared/response/sendResponse");
const logger=require("../../../shared/logger/logger");

const registerController=async(req,res,next)=>{
try{
const result=await registerUser({
role:req.body.role,
username:req.body.username,
email:req.body.email,
password:req.body.password,
identityId:req.body.identityId,
fullName:req.body.fullName
});

logger.info("User registered",{
module:"Auth",
userId:result.data.userId,
role:result.data.role
});

return sendResponse(res,{
success:result.success,
message:result.message,
data:result.data
});
}catch(error){
logger.error("User registration failed",error,{
module:"Auth",
email:req.body.email,
username:req.body.username
});
next(error);
}
};

module.exports={
registerController
};
//backend/src/modules/controllers/changePassword.controller.js
const {changePassword}=require("../services/changePassword.service");
const sendResponse=require("../../../shared/response/sendResponse");
const logger=require("../../../shared/logger/logger");

const changePasswordController=async(req,res,next)=>{
try{
const result=await changePassword({
userId:req.user.id,
oldPassword:req.body.oldPassword,
newPassword:req.body.newPassword
});

logger.info("Password changed",{
module:"Auth",
userId:req.user.id
});

return sendResponse(res,{
success:result.success,
message:result.message,
data:result.data
});
}catch(error){
logger.error("Password change failed",error,{
module:"Auth",
userId:req.user?.id
});
next(error);
}
};

module.exports={
changePasswordController
};
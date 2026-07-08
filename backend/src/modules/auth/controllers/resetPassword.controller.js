//backend/src/modules/controllers/resetPassword.controller.js
const {resetPassword}=require("../services/resetPassword.service");
const sendResponse=require("../../../shared/response/sendResponse");
const logger=require("../../../shared/logger/logger");

const resetPasswordController=async(req,res,next)=>{
try{
const result=await resetPassword({
identifier:req.body.identifier,
resetSecret:req.body.resetSecret,
newPassword:req.body.newPassword
});

logger.info("Password reset successful",{
module:"Auth",
identifier:req.body.identifier
});

return sendResponse(res,result);
}catch(error){
logger.error("Password reset failed",error,{
module:"Auth",
identifier:req.body.identifier
});
next(error);
}
};

module.exports={
resetPasswordController
};
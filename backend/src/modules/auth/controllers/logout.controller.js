//backend/src/modules/controllers/logout.controller.js
const {logoutUser}=require("../services/logout.service");
const sendResponse=require("../../../shared/response/sendResponse");
const logger=require("../../../shared/logger/logger");

const logoutController=async(req,res,next)=>{
try{
const result=await logoutUser(req.user.id);

logger.info("User logged out",{
module:"Auth",
userId:req.user.id
});

return sendResponse(res,{
success:result.success,
message:result.message,
data:result.data
});
}catch(error){
logger.error("Logout failed",error,{
module:"Auth",
userId:req.user?.id
});
next(error);
}
};

module.exports={
logoutController
};
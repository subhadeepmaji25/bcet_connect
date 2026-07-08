//backend/src/modules/controllers/login.controller.js
const {loginUser}=require("../services/login.service");
const sendResponse=require("../../../shared/response/sendResponse");
const logger=require("../../../shared/logger/logger");

const loginController=async(req,res,next)=>{
try{
const result=await loginUser({
identifier:req.body.identifier,
password:req.body.password
});

logger.info("User logged in",{
module:"Auth",
userId:result.data.user.id
});

return sendResponse(res,{
success:true,
message:result.message,
data:result.data
});
}catch(error){
logger.error("Login failed",error,{
module:"Auth"
});
next(error);
}
};

module.exports={
loginController
};
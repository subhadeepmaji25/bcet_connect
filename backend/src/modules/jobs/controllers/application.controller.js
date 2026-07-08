// backend/src/modules/jobs/controllers/application.controller.js
const applicationService=require("../services/application.service");
const sendResponse=require("../../../shared/response/sendResponse");
const asyncHandler=require("../../../shared/utils/asyncHandler");
const logger=require("../../../shared/logger/logger");

const applyForJobController=asyncHandler(async(req,res)=>{
const result=await applicationService.applyForJob(
req.params.jobId,
req.user.id,
req.body
);
logger.info("Job application submitted",{
module:"Jobs",
userId:req.user.id,
jobId:req.params.jobId
});
return sendResponse(res,{statusCode:201,...result});
});

const withdrawApplicationController=asyncHandler(async(req,res)=>{
const result=await applicationService.withdrawApplication(
req.params.applicationId,
req.user.id
);
logger.info("Application withdrawn",{
module:"Jobs",
userId:req.user.id,
applicationId:req.params.applicationId
});
return sendResponse(res,result);
});

const getMyApplicationsController=asyncHandler(async(req,res)=>{
const result=await applicationService.getMyApplications(req.user.id,req.query);
return sendResponse(res,{
success:true,
message:"Your applications fetched",
data:{applications:result.applications},
meta:{pagination:result.pagination}
});
});

const getJobApplicationsController=asyncHandler(async(req,res)=>{
const result=await applicationService.getJobApplications(
req.params.jobId,
req.user.id,
req.user.role,
req.query
);
return sendResponse(res,{
success:true,
message:"Applications fetched",
data:{applications:result.applications},
meta:{pagination:result.pagination}
});
});

const updateApplicationStatusController=asyncHandler(async(req,res)=>{
const result=await applicationService.updateApplicationStatus(
req.params.applicationId,
req.user.id,
req.user.role,
req.body.status,
req.body.note
);
logger.info("Application status updated",{
module:"Jobs",
reviewerId:req.user.id,
applicationId:req.params.applicationId,
newStatus:req.body.status
});
return sendResponse(res,result);
});

module.exports={
applyForJobController,
withdrawApplicationController,
getMyApplicationsController,
getJobApplicationsController,
updateApplicationStatusController
};
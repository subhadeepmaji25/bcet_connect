// backend/src/modules/jobs/controllers/job.controller.js
const jobService=require("../services/job.service");
const sendResponse=require("../../../shared/response/sendResponse");
const asyncHandler=require("../../../shared/utils/asyncHandler");
const logger=require("../../../shared/logger/logger");

const createJobController=asyncHandler(async(req,res)=>{
const result=await jobService.createJob(req.user.id,req.user.role,req.body);
logger.info("Job created",{module:"Jobs",userId:req.user.id});
return sendResponse(res,{statusCode:201,...result});
});

const updateJobController=asyncHandler(async(req,res)=>{
const result=await jobService.updateJob(req.params.jobId,req.user.id,req.body);
logger.info("Job updated",{module:"Jobs",userId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const deleteJobController=asyncHandler(async(req,res)=>{
const result=await jobService.deleteJob(req.params.jobId,req.user.id,req.user.role);
logger.info("Job deleted",{module:"Jobs",userId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const approveJobController=asyncHandler(async(req,res)=>{
const result=await jobService.approveJob(req.params.jobId,req.user.id);
logger.info("Job approved",{module:"Jobs",adminId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const rejectJobController=asyncHandler(async(req,res)=>{
const result=await jobService.rejectJob(req.params.jobId,req.user.id,req.body.rejectionReason);
logger.info("Job rejected",{module:"Jobs",adminId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const closeJobController=asyncHandler(async(req,res)=>{
const result=await jobService.closeJob(req.params.jobId,req.user.id,req.user.role,req.body.closedReason);
logger.info("Job closed",{module:"Jobs",userId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const reopenJobController=asyncHandler(async(req,res)=>{
const result=await jobService.reopenJob(req.params.jobId,req.user.id,req.user.role,req.body);
logger.info("Job reopened",{module:"Jobs",userId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const archiveJobController=asyncHandler(async(req,res)=>{
const result=await jobService.archiveJob(req.params.jobId,req.user.id,req.user.role);
logger.info("Job archived",{module:"Jobs",userId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const featureJobController=asyncHandler(async(req,res)=>{
const featured=req.body.featured!==undefined?req.body.featured:true;
const result=await jobService.featureJob(req.params.jobId,req.user.id,featured);
logger.info("Job feature toggled",{module:"Jobs",adminId:req.user.id,jobId:req.params.jobId,featured});
return sendResponse(res,result);
});

const verifyCompanyController=asyncHandler(async(req,res)=>{
const result=await jobService.verifyCompany(req.params.jobId,req.user.id);
logger.info("Company verified",{module:"Jobs",adminId:req.user.id,jobId:req.params.jobId});
return sendResponse(res,result);
});

const getAnalyticsController=asyncHandler(async(req,res)=>{
const result=await jobService.getAnalytics(req.params.jobId,req.user.id,req.user.role);
return sendResponse(res,result);
});

const getApprovedJobsController=asyncHandler(async(req,res)=>{
const result=await jobService.getApprovedJobs(req.query,{
userId:req.user.id,
userRole:req.user.role
});
return sendResponse(res,{
success:true,
message:"Jobs fetched successfully",
data:{jobs:result.jobs},
meta:{pagination:result.pagination}
});
});

const getPendingJobsController=asyncHandler(async(req,res)=>{
const result=await jobService.getPendingJobs(req.query);
return sendResponse(res,{
success:true,
message:"Pending jobs fetched",
data:{jobs:result.jobs},
meta:{pagination:result.pagination}
});
});

const getMyJobsController=asyncHandler(async(req,res)=>{
const result=await jobService.getMyJobs(req.user.id,req.query);
return sendResponse(res,{
success:true,
message:"Your jobs fetched",
data:{jobs:result.jobs},
meta:{pagination:result.pagination}
});
});

const getJobByIdController=asyncHandler(async(req,res)=>{
const job=await jobService.getJobById(req.params.jobId,req.user.id,req.user.role);
return sendResponse(res,{
success:true,
message:"Job fetched successfully",
data:{job}
});
});

module.exports={
createJobController,
updateJobController,
deleteJobController,
approveJobController,
rejectJobController,
closeJobController,
reopenJobController,
archiveJobController,
featureJobController,
verifyCompanyController,
getAnalyticsController,
getApprovedJobsController,
getPendingJobsController,
getMyJobsController,
getJobByIdController
};

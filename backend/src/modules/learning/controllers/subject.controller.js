// backend/src/modules/learning/controllers/subject.controller.js
const subjectService=require("../services/subject.service");
const sendResponse=require("../../../shared/response/sendResponse");
const asyncHandler=require("../../../shared/utils/asyncHandler");
const logger=require("../../../shared/logger/logger");

const createSubjectController=asyncHandler(async(req,res)=>{const result=await subjectService.createSubject(req.user.id,req.user.role,req.body);logger.info("Subject created",{module:"Learning",userId:req.user.id});return sendResponse(res,{statusCode:201,...result});});

const updateSubjectController=asyncHandler(async(req,res)=>{const result=await subjectService.updateSubject(req.params.subjectId,req.user.id,req.user.role,req.body);logger.info("Subject updated",{module:"Learning",userId:req.user.id,subjectId:req.params.subjectId});return sendResponse(res,result);});

const archiveSubjectController=asyncHandler(async(req,res)=>{const result=await subjectService.archiveSubject(req.params.subjectId,req.user.id,req.user.role);logger.info("Subject archived",{module:"Learning",userId:req.user.id,subjectId:req.params.subjectId});return sendResponse(res,result);});

const listSubjectsController=asyncHandler(async(req,res)=>{const result=await subjectService.listSubjects(req.query);return sendResponse(res,{success:true,message:"Subjects fetched successfully",data:{subjects:result.subjects},meta:{pagination:result.pagination}});});

const getMySubjectsController=asyncHandler(async(req,res)=>{const result=await subjectService.getMySubjects(req.user.id,req.query);return sendResponse(res,{success:true,message:"Your subjects fetched",data:{subjects:result.subjects},meta:{pagination:result.pagination}});});

const getSubjectByIdController=asyncHandler(async(req,res)=>{const subject=await subjectService.getSubjectById(req.params.subjectId);return sendResponse(res,{success:true,message:"Subject fetched successfully",data:{subject}});});

module.exports={createSubjectController,updateSubjectController,archiveSubjectController,listSubjectsController,getMySubjectsController,getSubjectByIdController};
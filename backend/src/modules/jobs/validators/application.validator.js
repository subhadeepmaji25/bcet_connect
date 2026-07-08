// backend/src/modules/jobs/validators/application.validator.js
const Joi=require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const REVIEW_STATUSES=["shortlisted","rejected","accepted"];

const applyJobSchema=Joi.object({
resumeId:Joi.string().hex().length(24).optional(),
coverLetter:Joi.string().trim().max(2000).allow("").optional()
});

const reviewApplicationSchema=Joi.object({
status:Joi.string().valid(...REVIEW_STATUSES).required(),
note:Joi.string().trim().max(500).allow("").optional()
});

const validateApplyJob=(req,res,next)=>{
const{error,value}=applyJobSchema.validate(req.body,{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

const validateReviewApplication=(req,res,next)=>{
const{error,value}=reviewApplicationSchema.validate(req.body,{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

module.exports={validateApplyJob,validateReviewApplication};
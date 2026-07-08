// backend/src/modules/jobs/validators/job.validator.js
const Joi=require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const EMPLOYMENT_TYPES=["full-time","part-time","internship","contract","freelance","remote","hybrid"];
const JOB_CATEGORIES=["software-engineering","data-science","machine-learning","web-development","mobile-development","devops","cybersecurity","ui-ux","product-management","business-analyst","research","teaching","other"];
const JOB_VISIBILITY=["public","campus-only","branch-specific","hidden"];

const eligibilitySchema=Joi.object({
allowedRoles:Joi.array().items(Joi.string().valid("student","alumni")).optional(),
allowedBranches:Joi.array().items(Joi.string().trim().max(50)).optional(),
minimumCGPA:Joi.number().min(0).max(10).optional(),
passoutYears:Joi.array().items(Joi.number().integer().min(2000).max(2100)).optional(),
backlogsAllowed:Joi.boolean().optional()
});

const createJobSchema=Joi.object({
title:Joi.string().trim().min(3).max(150).required(),
company:Joi.string().trim().min(2).max(150).required(),
description:Joi.string().trim().min(20).max(10000).required(),
category:Joi.string().valid(...JOB_CATEGORIES).optional(),
employmentType:Joi.string().valid(...EMPLOYMENT_TYPES).optional(),
location:Joi.string().trim().max(150).allow("").optional(),
isRemote:Joi.boolean().optional(),
requiredSkills:Joi.array().items(Joi.string().trim().lowercase().max(100)).min(1).max(20).required(),
preferredSkills:Joi.array().items(Joi.string().trim().lowercase().max(100)).max(20).optional(),
minExperienceYears:Joi.number().min(0).max(30).optional(),
targetRoles:Joi.array().items(Joi.string().valid("student","alumni","faculty")).optional(),
salaryMin:Joi.number().min(0).optional(),
salaryMax:Joi.number().min(0).optional(),
salaryCurrency:Joi.string().max(10).optional(),
isSalaryVisible:Joi.boolean().optional(),
deadline:Joi.date().greater("now").optional(),
applyUrl:Joi.string().uri().allow("").optional(),
eligibility:eligibilitySchema.optional(),
visibility:Joi.string().valid(...JOB_VISIBILITY).optional()
}).custom((value,helpers)=>{
if(value.salaryMin!==undefined&&value.salaryMax!==undefined&&value.salaryMax<value.salaryMin){
return helpers.message("salaryMax cannot be less than salaryMin");
}
return value;
});

const updateJobSchema=Joi.object({
title:Joi.string().trim().min(3).max(150),
company:Joi.string().trim().min(2).max(150),
description:Joi.string().trim().min(20).max(10000),
category:Joi.string().valid(...JOB_CATEGORIES),
employmentType:Joi.string().valid(...EMPLOYMENT_TYPES),
location:Joi.string().trim().max(150).allow(""),
isRemote:Joi.boolean(),
requiredSkills:Joi.array().items(Joi.string().trim().lowercase().max(100)).min(1).max(20),
preferredSkills:Joi.array().items(Joi.string().trim().lowercase().max(100)).max(20),
minExperienceYears:Joi.number().min(0).max(30),
targetRoles:Joi.array().items(Joi.string().valid("student","alumni","faculty")),
salaryMin:Joi.number().min(0),
salaryMax:Joi.number().min(0),
isSalaryVisible:Joi.boolean(),
deadline:Joi.date().greater("now"),
applyUrl:Joi.string().uri().allow(""),
eligibility:eligibilitySchema,
visibility:Joi.string().valid(...JOB_VISIBILITY)
}).min(1);

const rejectJobSchema=Joi.object({
rejectionReason:Joi.string().trim().min(5).max(500).required()
});

const closeJobSchema=Joi.object({
closedReason:Joi.string().trim().max(500).allow("").optional()
});

const reopenJobSchema=Joi.object({
deadline:Joi.date().greater("now").allow(null).optional()
});

const featureJobSchema=Joi.object({
featured:Joi.boolean().optional().default(true)
});

const validateCreateJob=(req,res,next)=>{
const{error,value}=createJobSchema.validate(req.body,{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

const validateUpdateJob=(req,res,next)=>{
const{error,value}=updateJobSchema.validate(req.body,{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

const validateRejectJob=(req,res,next)=>{
const{error,value}=rejectJobSchema.validate(req.body,{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

const validateCloseJob=(req,res,next)=>{
const{error,value}=closeJobSchema.validate(req.body,{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

const validateReopenJob=(req,res,next)=>{
const{error,value}=reopenJobSchema.validate(req.body || {},{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

const validateFeatureJob=(req,res,next)=>{
const{error,value}=featureJobSchema.validate(req.body,{abortEarly:false,stripUnknown:true});
if(error)return next(ApiError.badRequest(error.details.map(d=>d.message).join(", ")));
req.body=value;
next();
};

module.exports={
validateCreateJob,
validateUpdateJob,
validateRejectJob,
validateCloseJob,
validateReopenJob,
validateFeatureJob
};

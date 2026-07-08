// backend/src/modules/jobs/models/Job.js
const mongoose=require("mongoose");

const EMPLOYMENT_TYPES=["full-time","part-time","internship","contract","freelance","remote","hybrid"];
const JOB_STATUS=["pending","approved","rejected","closed","expired"];
const JOB_CATEGORIES=["software-engineering","data-science","machine-learning","web-development","mobile-development","devops","cybersecurity","ui-ux","product-management","business-analyst","research","teaching","other"];
const JOB_VISIBILITY=["public","campus-only","branch-specific","hidden"];

const jobSchema=new mongoose.Schema({
postedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
postedByRole:{type:String,enum:["faculty","alumni","admin"],required:true},
title:{type:String,required:true,trim:true,maxlength:150},
company:{type:String,required:true,trim:true,maxlength:150},
description:{type:String,required:true,maxlength:10000},
category:{type:String,enum:JOB_CATEGORIES,default:"software-engineering"},
employmentType:{type:String,enum:EMPLOYMENT_TYPES,default:"full-time"},
location:{type:String,trim:true,default:""},
isRemote:{type:Boolean,default:false},
requiredSkills:[{type:String,trim:true,lowercase:true}],
preferredSkills:[{type:String,trim:true,lowercase:true}],
minExperienceYears:{type:Number,min:0,default:0},
targetRoles:{type:[String],enum:["student","alumni","faculty"],default:["student","alumni"]},
salaryMin:{type:Number,min:0,default:null},
salaryMax:{type:Number,min:0,default:null},
salaryCurrency:{type:String,default:"INR"},
isSalaryVisible:{type:Boolean,default:true},
deadline:{type:Date,default:null},
eligibility:{
allowedRoles:{type:[String],enum:["student","alumni"],default:["student","alumni"]},
allowedBranches:{type:[String],default:[]},
minimumCGPA:{type:Number,min:0,max:10,default:0},
passoutYears:{type:[Number],default:[]},
backlogsAllowed:{type:Boolean,default:true}
},
visibility:{type:String,enum:JOB_VISIBILITY,default:"public"},
metadata:{
featured:{type:Boolean,default:false},
priority:{type:Number,default:0,min:0,max:10},
verifiedCompany:{type:Boolean,default:false},
tags:{type:[String],default:[]}
},
analytics:{
clicks:{type:Number,default:0},
shares:{type:Number,default:0},
bookmarks:{type:Number,default:0}
},
status:{type:String,enum:JOB_STATUS,default:"pending",index:true},
approvedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
approvedAt:{type:Date,default:null},
rejectedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
rejectedAt:{type:Date,default:null},
rejectionReason:{type:String,trim:true,default:""},
closedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
closedAt:{type:Date,default:null},
closedReason:{type:String,trim:true,default:""},
expiredAt:{type:Date,default:null},
reopenedAt:{type:Date,default:null},
isArchived:{type:Boolean,default:false},
archivedAt:{type:Date,default:null},
viewCount:{type:Number,default:0},
applicationCount:{type:Number,default:0},
applyUrl:{type:String,default:null,match:[/^https?:\/\/.+/,"Invalid URL"]},
isDeleted:{type:Boolean,default:false},
deletedAt:{type:Date,default:null}
},{timestamps:true,versionKey:false});

jobSchema.index({status:1,deadline:1});
jobSchema.index({postedBy:1,status:1});
jobSchema.index({requiredSkills:1});
jobSchema.index({employmentType:1});
jobSchema.index({category:1});
jobSchema.index({isDeleted:1});
jobSchema.index({isArchived:1});
jobSchema.index({"metadata.featured":1,"metadata.priority":-1});
jobSchema.index({"eligibility.allowedBranches":1});
jobSchema.index({title:"text",description:"text",company:"text"});

jobSchema.virtual("isOpen").get(function(){
if(this.status!=="approved")return false;
if(!this.deadline)return true;
return new Date()<new Date(this.deadline);
});

jobSchema.virtual("isExpired").get(function(){
if(!this.deadline)return false;
return new Date()>new Date(this.deadline);
});

module.exports=mongoose.model("Job",jobSchema);
module.exports.JOB_STATUS=JOB_STATUS;
module.exports.JOB_CATEGORIES=JOB_CATEGORIES;
module.exports.EMPLOYMENT_TYPES=EMPLOYMENT_TYPES;
module.exports.JOB_VISIBILITY=JOB_VISIBILITY;
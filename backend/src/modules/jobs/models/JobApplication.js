// backend/src/modules/jobs/models/JobApplication.js
const mongoose=require("mongoose");

const APPLICATION_STATUS=["applied","shortlisted","rejected","accepted","withdrawn"];

const statusHistorySchema=new mongoose.Schema({
status:{type:String,enum:APPLICATION_STATUS,required:true},
changedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
changedAt:{type:Date,default:Date.now},
note:{type:String,trim:true,default:""}
},{_id:false});

const applicationSchema=new mongoose.Schema({
jobId:{type:mongoose.Schema.Types.ObjectId,ref:"Job",required:true,index:true},
applicantId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
resumeId:{type:mongoose.Schema.Types.ObjectId,ref:"Resume",default:null},
coverLetter:{type:String,maxlength:2000,default:""},
status:{type:String,enum:APPLICATION_STATUS,default:"applied",index:true},
statusHistory:{type:[statusHistorySchema],default:[]},
matchScore:{type:Number,min:0,max:100,default:0},
reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
reviewedAt:{type:Date,default:null},
reviewNote:{type:String,default:""},
withdrawnAt:{type:Date,default:null}
},{timestamps:true,versionKey:false});

applicationSchema.index({jobId:1,applicantId:1},{unique:true});
applicationSchema.index({applicantId:1,status:1});
applicationSchema.index({jobId:1,status:1});

module.exports=mongoose.model("JobApplication",applicationSchema);
module.exports.APPLICATION_STATUS=APPLICATION_STATUS;
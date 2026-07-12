// backend/src/modules/learning/models/LearningProgress.js
const mongoose=require("mongoose");

const PROGRESS_STATUS=Object.freeze({STARTED:"started",IN_PROGRESS:"in_progress",COMPLETED:"completed"});
const PROGRESS_STATUS_VALUES=Object.freeze(Object.values(PROGRESS_STATUS));

const learningProgressSchema=new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  resourceId:{type:mongoose.Schema.Types.ObjectId,ref:"LearningResource",required:true,index:true},
  status:{type:String,enum:PROGRESS_STATUS_VALUES,default:PROGRESS_STATUS.STARTED},
  completionPercent:{type:Number,min:0,max:100,default:0},
  openCount:{type:Number,default:0,min:0},
  lastOpenedAt:{type:Date,default:Date.now},
  completedAt:{type:Date,default:null}
},{timestamps:true,versionKey:false});

learningProgressSchema.index({userId:1,resourceId:1},{unique:true});
learningProgressSchema.index({userId:1,status:1,lastOpenedAt:-1});
learningProgressSchema.index({resourceId:1,status:1});

module.exports=mongoose.model("LearningProgress",learningProgressSchema);
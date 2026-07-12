// backend/src/modules/learning/models/ResourceVersion.js
const mongoose=require("mongoose");

const fileSnapshotSchema=new mongoose.Schema({url:{type:String,required:true},publicId:{type:String,required:true},mimeType:{type:String,required:true},size:{type:Number,required:true},originalName:{type:String,trim:true,default:""}},{_id:false});

const resourceVersionSchema=new mongoose.Schema({resourceId:{type:mongoose.Schema.Types.ObjectId,ref:"LearningResource",required:true,index:true},versionNumber:{type:Number,required:true,min:1},file:{type:fileSnapshotSchema,default:null},externalUrlSnapshot:{type:String,trim:true,default:""},title:{type:String,trim:true,required:true},description:{type:String,trim:true,default:""},changeLog:{type:String,trim:true,maxlength:500,default:""},updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}},{timestamps:true,versionKey:false});

resourceVersionSchema.index({resourceId:1,versionNumber:-1},{unique:true});

module.exports=mongoose.model("ResourceVersion",resourceVersionSchema);
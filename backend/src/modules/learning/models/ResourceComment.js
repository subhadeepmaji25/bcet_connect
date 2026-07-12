// backend/src/modules/learning/models/ResourceComment.js
const mongoose=require("mongoose");

const COMMENT_STATUS_VALUES=Object.freeze(["active","removed"]);

const resourceCommentSchema=new mongoose.Schema({resourceId:{type:mongoose.Schema.Types.ObjectId,ref:"LearningResource",required:true,index:true},authorId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},content:{type:String,trim:true,required:true,maxlength:1000},parentCommentId:{type:mongoose.Schema.Types.ObjectId,ref:"ResourceComment",default:null,index:true},likeCount:{type:Number,default:0,min:0},likedBy:{type:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],default:[]},isEdited:{type:Boolean,default:false},editedAt:{type:Date,default:null},status:{type:String,enum:COMMENT_STATUS_VALUES,default:"active"}},{timestamps:true,versionKey:false});

resourceCommentSchema.index({resourceId:1,createdAt:1});
resourceCommentSchema.index({resourceId:1,parentCommentId:1});

module.exports=mongoose.model("ResourceComment",resourceCommentSchema);
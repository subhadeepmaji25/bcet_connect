// backend/src/modules/learning/models/ResourceRating.js
const mongoose=require("mongoose");

const resourceRatingSchema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},resourceId:{type:mongoose.Schema.Types.ObjectId,ref:"LearningResource",required:true,index:true},rating:{type:Number,min:1,max:5,required:true},review:{type:String,trim:true,maxlength:500,default:""}},{timestamps:true,versionKey:false});

resourceRatingSchema.index({userId:1,resourceId:1},{unique:true});
resourceRatingSchema.index({resourceId:1,createdAt:-1});

module.exports=mongoose.model("ResourceRating",resourceRatingSchema);
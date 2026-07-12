// backend/src/modules/learning/models/ResourceBookmark.js
const mongoose=require("mongoose");

const resourceBookmarkSchema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},resourceId:{type:mongoose.Schema.Types.ObjectId,ref:"LearningResource",required:true,index:true}},{timestamps:true,versionKey:false});

resourceBookmarkSchema.index({userId:1,resourceId:1},{unique:true});
resourceBookmarkSchema.index({userId:1,createdAt:-1});

module.exports=mongoose.model("ResourceBookmark",resourceBookmarkSchema);
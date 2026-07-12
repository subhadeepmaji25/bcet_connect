// backend/src/modules/learning/models/LearningResource.js
const mongoose=require("mongoose");
const{RESOURCE_TYPE_VALUES,VISIBILITY,VISIBILITY_VALUES,RESOURCE_STATUS,RESOURCE_STATUS_VALUES,UPLOADER_ROLE_VALUES,DIFFICULTY_VALUES}=require("../constants/resource.constants");

const fileSchema=new mongoose.Schema({url:{type:String,required:true},publicId:{type:String,required:true},mimeType:{type:String,required:true},size:{type:Number,required:true},originalName:{type:String,trim:true,default:""}},{_id:false});

const learningResourceSchema=new mongoose.Schema({title:{type:String,required:true,trim:true,maxlength:150},description:{type:String,trim:true,maxlength:1000,default:""},type:{type:String,enum:RESOURCE_TYPE_VALUES,required:true},subjectId:{type:mongoose.Schema.Types.ObjectId,ref:"Subject",required:true,index:true},department:{type:String,required:true,trim:true,index:true},semester:{type:Number,required:true,index:true},section:{type:String,trim:true,uppercase:true,default:""},visibility:{type:String,enum:VISIBILITY_VALUES,default:VISIBILITY.DEPARTMENT},file:{type:fileSchema,default:null},externalUrl:{type:String,trim:true,default:""},uploaderId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},uploaderRole:{type:String,enum:UPLOADER_ROLE_VALUES,required:true},status:{type:String,enum:RESOURCE_STATUS_VALUES,default:RESOURCE_STATUS.PENDING,index:true},verifiedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},verifiedAt:{type:Date,default:null},rejectionReason:{type:String,trim:true,default:""},tags:{type:[{type:String,trim:true,lowercase:true}],default:[]},difficulty:{type:String,enum:DIFFICULTY_VALUES,default:null},estimatedTimeMinutes:{type:Number,min:0,default:null},viewCount:{type:Number,default:0,min:0},downloadCount:{type:Number,default:0,min:0},bookmarkCount:{type:Number,default:0,min:0},ratingAverage:{type:Number,default:0,min:0,max:5},ratingCount:{type:Number,default:0,min:0},isArchived:{type:Boolean,default:false,index:true}},{timestamps:true,versionKey:false});

learningResourceSchema.index({status:1,department:1,semester:1,createdAt:-1});
learningResourceSchema.index({subjectId:1,status:1});
learningResourceSchema.index({uploaderId:1,status:1});
learningResourceSchema.index({tags:1});
learningResourceSchema.index({title:"text",description:"text"});

module.exports=mongoose.model("LearningResource",learningResourceSchema);
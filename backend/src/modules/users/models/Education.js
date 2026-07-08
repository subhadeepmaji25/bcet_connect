// backend/src/modules/users/models/Education.js
const mongoose=require("mongoose");
const EDUCATION_LEVELS=["diploma","bachelor","master","phd","other"];
const GRADE_TYPES=["cgpa","percentage","grade"];
const educationSchema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},institution:{type:String,required:true,trim:true,maxlength:200},degree:{type:String,required:true,trim:true,maxlength:150},branch:{type:String,required:true,trim:true,maxlength:150},specialization:{type:String,trim:true,default:""},educationLevel:{type:String,enum:EDUCATION_LEVELS,default:"bachelor"},startYear:{type:Number,required:true,min:1950},endYear:{type:Number},current:{type:Boolean,default:false},gradeType:{type:String,enum:GRADE_TYPES,default:"cgpa"},cgpa:{type:Number,min:0,max:10},achievements:[{type:String,trim:true}],skillsExtracted:[{type:String,trim:true,lowercase:true}],tags:[{type:String,trim:true,lowercase:true}],location:{type:String,trim:true,default:""},educationScore:{type:Number,min:0,max:100,default:0}},{timestamps:true,versionKey:false});
educationSchema.index({userId:1});
educationSchema.index({institution:1});
educationSchema.index({degree:1});
educationSchema.index({branch:1});
educationSchema.index({educationLevel:1});
educationSchema.index({endYear:1});
educationSchema.index({skillsExtracted:1});
educationSchema.index({tags:1});
educationSchema.pre("save",function(){if(this.endYear&&this.endYear<this.startYear){throw new Error("End year cannot be less than start year");}if(this.current){this.endYear=undefined;}});
educationSchema.virtual("isCompleted").get(function(){return!this.current&&!!this.endYear;});
module.exports=mongoose.model("Education",educationSchema);
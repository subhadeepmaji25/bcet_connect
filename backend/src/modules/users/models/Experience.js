// backend/src/modules/users/models/Experience.js
const mongoose=require("mongoose");
const EMPLOYMENT_TYPES=["internship","full-time","part-time","freelance","contract","research","volunteer","other"];
const proofSchema=new mongoose.Schema({title:{type:String,trim:true,default:""},url:{type:String,trim:true,default:""},type:{type:String,trim:true,default:"certificate"}},{_id:false});
const experienceSchema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},company:{type:String,required:true,trim:true,maxlength:200},companyDomain:{type:String,trim:true,default:""},position:{type:String,required:true,trim:true,maxlength:150},employmentType:{type:String,enum:EMPLOYMENT_TYPES,default:"internship"},industry:{type:String,trim:true,default:""},description:{type:String,maxlength:3000,default:""},achievements:[{type:String,trim:true}],skillsUsed:[{type:String,trim:true,lowercase:true}],location:{type:String,trim:true,default:""},startDate:{type:Date,required:true},endDate:{type:Date},currentlyWorking:{type:Boolean,default:false},proofs:{type:[proofSchema],default:[]},experienceScore:{type:Number,min:0,max:100,default:0},searchScore:{type:Number,default:0}},{timestamps:true,versionKey:false,toJSON:{virtuals:true},toObject:{virtuals:true}});
experienceSchema.index({userId:1});
experienceSchema.index({company:1});
experienceSchema.index({position:1});
experienceSchema.index({employmentType:1});
experienceSchema.index({industry:1});
experienceSchema.index({skillsUsed:1});
experienceSchema.index({experienceScore:-1});
experienceSchema.pre("save",function(){if(this.endDate&&this.startDate&&this.endDate<this.startDate){throw new Error("End date cannot be before start date");}if(this.currentlyWorking){this.endDate=undefined;}});
experienceSchema.virtual("durationInMonths").get(function(){const end=this.currentlyWorking?new Date():this.endDate;if(!end)return 0;const months=(end.getFullYear()-this.startDate.getFullYear())*12+(end.getMonth()-this.startDate.getMonth());return Math.max(months,0);});
experienceSchema.virtual("isProfessionalExperience").get(function(){return["full-time","contract","freelance"].includes(this.employmentType);});
module.exports=mongoose.model("Experience",experienceSchema);
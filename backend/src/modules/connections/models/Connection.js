// backend/src/modules/connections/models/Connection.js
const mongoose=require("mongoose");
const {CONNECTION_STATUS,CONNECTION_STATUS_VALUES}=require("../constants/connection.constants");
const connectionSchema=new mongoose.Schema({userA:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},userB:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},status:{type:String,enum:CONNECTION_STATUS_VALUES,default:CONNECTION_STATUS.ACTIVE,index:true},removedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},removedAt:{type:Date,default:null}},{timestamps:true,versionKey:false});
connectionSchema.index({userA:1,userB:1},{unique:true});
connectionSchema.index({userB:1,status:1});
connectionSchema.index({userA:1,status:1});
module.exports=mongoose.model("Connection",connectionSchema);
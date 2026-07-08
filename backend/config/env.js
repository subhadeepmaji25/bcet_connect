// backend/config/env.js
const dotenv=require("dotenv");
dotenv.config();
const REQUIRED_ENV_VARS=["NODE_ENV","PORT","MONGO_URI","JWT_SECRET","JWT_EXPIRES_IN","PASSWORD_RESET_SECRET","LOGIN_LOCK_TIME"];
const missingVariables=REQUIRED_ENV_VARS.filter(key=>!process.env[key]||process.env[key].trim()==="");
if(missingVariables.length>0){
console.error("\n❌ Missing Environment Variables:\n");
missingVariables.forEach(variable=>console.error(`   • ${variable}`));
console.error("\nPlease update your .env file.\n");
process.exit(1);
}
const env={
app:{
nodeEnv:process.env.NODE_ENV,
port:Number(process.env.PORT)
},
database:{
mongoUri:process.env.MONGO_URI
},
jwt:{
secret:process.env.JWT_SECRET,
expiresIn:process.env.JWT_EXPIRES_IN
},
auth:{
passwordResetSecret:process.env.PASSWORD_RESET_SECRET,
loginLockTime:Number(process.env.LOGIN_LOCK_TIME)
}
};
module.exports=Object.freeze(env);
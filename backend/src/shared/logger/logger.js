// backend/src/shared/logger/logger.js
const{app}=require("../../../config");

const timestamp=()=>new Date().toISOString();

const format=(level,message)=>`[${timestamp()}] [${level}] ${message}`;

const logger={
info(message){
console.log(format("INFO",message));
},

success(message){
console.log(format("SUCCESS",message));
},

warn(message){
console.warn(format("WARNING",message));
},

error(message,error=null){
console.error(format("ERROR",message));
if(error&&app.environment==="development"){
console.error(error.stack||error);
}
},

debug(message){
if(app.environment!=="development"){
return;
}
console.log(format("DEBUG",message));
}
};

Object.freeze(logger);

module.exports=logger;
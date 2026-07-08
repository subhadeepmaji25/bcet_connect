// backend/src/modules/resume-parser/services/parser.service.js
const{parsePdf}=require("./pdfParser.service");
const{extractCleanText}=require("./textExtractor.service");
const{extractSkills}=require("./skillExtractor.service");
const logger=require("../../../shared/logger/logger");

const parseResumeFile=async(filePath,fileMeta={})=>{
const{userId=null}=fileMeta;
const parseResult=await parsePdf(filePath,fileMeta);
const cleanTextResult=extractCleanText(parseResult.rawText);
const skillResult=extractSkills(cleanTextResult);
logger.info("Resume parsing pipeline completed",{
module:"ResumeParser",
userId,
pages:parseResult.pageCount,
totalSkillsFound:skillResult.skills.length,
highConfidenceSkills:skillResult.highConfidenceSkills.length
});
return{
rawText:parseResult.rawText,
cleanText:cleanTextResult.cleanText,
pageCount:parseResult.pageCount,
characterCount:parseResult.characterCount,
info:parseResult.info,
sections:cleanTextResult.sections,
skills:skillResult.skills,
highConfidenceSkills:skillResult.highConfidenceSkills,
lowConfidenceSkills:skillResult.lowConfidenceSkills,
detailedSkills:skillResult.detailedSkills
};
};

module.exports={parseResumeFile};
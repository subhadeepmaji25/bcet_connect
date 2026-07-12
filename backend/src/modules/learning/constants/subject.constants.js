// backend/src/modules/learning/constants/subject.constants.js
const mongoose=require("mongoose");

const SEMESTER_MIN=1;
const SEMESTER_MAX=8;
const CREDITS_MIN=1;
const CREDITS_MAX=6;

const SUBJECT_MANAGER_ROLES=Object.freeze(["faculty","admin"]);

module.exports={SEMESTER_MIN,SEMESTER_MAX,CREDITS_MIN,CREDITS_MAX,SUBJECT_MANAGER_ROLES};
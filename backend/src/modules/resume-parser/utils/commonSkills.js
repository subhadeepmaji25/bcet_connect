// backend/src/modules/resume-parser/utils/commonSkills.js
const PROGRAMMING_LANGUAGES = Object.freeze([
  "javascript", "typescript", "python", "java", "c", "c++", "c#",
  "go", "rust", "php", "ruby", "kotlin", "swift", "dart", "scala", "r"
]);
const FRONTEND_SKILLS = Object.freeze([
  "react", "vue", "angular", "nextjs", "html", "css", "tailwind",
  "bootstrap", "redux", "jquery", "sass", "webpack", "vite", "svelte"
]);
const BACKEND_SKILLS = Object.freeze([
  "nodejs", "express", "django", "flask", "spring", "springboot",
  "fastapi", "laravel", "nestjs", "graphql", "rest", "dotnet", "aspnet"
]);
const DATABASE_SKILLS = Object.freeze([
  "mongodb", "mysql", "postgresql", "mssql", "sqlite", "redis",
  "cassandra", "dynamodb", "firebase", "elasticsearch"
]);
const CLOUD_DEVOPS_SKILLS = Object.freeze([
  "amazon web services", "google cloud platform", "microsoft azure",
  "docker", "kubernetes", "jenkins", "cicd", "terraform", "nginx",
  "linux", "ansible", "github actions", "helm", "prometheus", "grafana", "argo cd"
]);
const DATA_AI_SKILLS = Object.freeze([
  "machine learning", "deep learning", "artificial intelligence",
  "natural language processing", "pandas", "numpy", "tensorflow",
  "pytorch", "scikit learn", "computer vision", "data science",
  "langchain", "langgraph", "crewai", "huggingface", "ollama",
  "openai api", "llamaindex", "mcp", "vector database", "pinecone",
  "weaviate", "chromadb", "claude api", "gemini api", "qdrant",
  "milvus", "vllm", "litellm", "haystack", "dspy", "autogen",
  "n8n", "supabase", "convex"
]);
const DATA_ENGINEERING_SKILLS = Object.freeze([
  "spark", "hadoop", "kafka", "airflow", "snowflake", "dbt"
]);
const CYBER_SECURITY_SKILLS = Object.freeze([
  "burp suite", "wireshark", "metasploit", "nmap", "owasp"
]);
const TESTING_SKILLS = Object.freeze([
  "jest", "mocha", "cypress", "playwright", "selenium"
]);
const UI_UX_SKILLS = Object.freeze([
  "adobe xd", "photoshop", "illustrator"
]);
const MOBILE_SKILLS = Object.freeze([
  "react native", "flutter", "android", "ios", "swift ui"
]);
const TOOLS_AND_PLATFORMS = Object.freeze([
  "git", "github", "gitlab", "jira", "postman", "figma", "vscode",
  "confluence", "slack", "trello"
]);
const CONCEPTS = Object.freeze([
  "data structures and algorithms", "object oriented programming",
  "system design", "microservices", "design patterns",
  "unit testing", "agile", "scrum"
]);

const COMPOSITE_SKILLS = Object.freeze({
  mern: ["mongodb", "express", "react", "nodejs"],
  mean: ["mongodb", "express", "angular", "nodejs"],
  mevn: ["mongodb", "express", "vue", "nodejs"],
  lamp: ["linux", "amazon web services", "mysql", "php"]
});

const SKILL_CATEGORIES = Object.freeze({
  programming: PROGRAMMING_LANGUAGES,
  frontend: FRONTEND_SKILLS,
  backend: BACKEND_SKILLS,
  database: DATABASE_SKILLS,
  cloud_devops: CLOUD_DEVOPS_SKILLS,
  data_ai: DATA_AI_SKILLS,
  data_engineering: DATA_ENGINEERING_SKILLS,
  cyber_security: CYBER_SECURITY_SKILLS,
  testing: TESTING_SKILLS,
  ui_ux: UI_UX_SKILLS,
  mobile: MOBILE_SKILLS,
  tools_platforms: TOOLS_AND_PLATFORMS,
  concepts: CONCEPTS
});

const KNOWN_SKILLS = Object.freeze([
  ...new Set([
    ...PROGRAMMING_LANGUAGES,
    ...FRONTEND_SKILLS,
    ...BACKEND_SKILLS,
    ...DATABASE_SKILLS,
    ...CLOUD_DEVOPS_SKILLS,
    ...DATA_AI_SKILLS,
    ...DATA_ENGINEERING_SKILLS,
    ...CYBER_SECURITY_SKILLS,
    ...TESTING_SKILLS,
    ...UI_UX_SKILLS,
    ...MOBILE_SKILLS,
    ...TOOLS_AND_PLATFORMS,
    ...CONCEPTS
  ])
]);

const KNOWN_SKILL_SET = new Set(KNOWN_SKILLS);

const CATEGORY_MAP = new Map();
for (const [categoryName, skills] of Object.entries(SKILL_CATEGORIES)) {
  for (const skill of skills) {
    if (!CATEGORY_MAP.has(skill)) {
      CATEGORY_MAP.set(skill, categoryName);
    }
  }
}

const isKnownSkill = (skill) => {
  if (!skill) return false;
  return KNOWN_SKILL_SET.has(String(skill).toLowerCase().trim());
};

const getCategoryBySkill = (skill) => {
  if (!skill) return null;
  const normalizedSkill = String(skill).toLowerCase().trim();
  return CATEGORY_MAP.get(normalizedSkill) || null;
};

const expandCompositeSkill = (token) => {
  if (!token) return null;
  const key = String(token).toLowerCase().trim();
  return COMPOSITE_SKILLS[key] ? [...COMPOSITE_SKILLS[key]] : null;
};

module.exports = {
  PROGRAMMING_LANGUAGES,
  FRONTEND_SKILLS,
  BACKEND_SKILLS,
  DATABASE_SKILLS,
  CLOUD_DEVOPS_SKILLS,
  DATA_AI_SKILLS,
  DATA_ENGINEERING_SKILLS,
  CYBER_SECURITY_SKILLS,
  TESTING_SKILLS,
  UI_UX_SKILLS,
  MOBILE_SKILLS,
  TOOLS_AND_PLATFORMS,
  CONCEPTS,
  COMPOSITE_SKILLS,
  SKILL_CATEGORIES,
  KNOWN_SKILLS,
  KNOWN_SKILL_SET,
  CATEGORY_MAP,
  isKnownSkill,
  getCategoryBySkill,
  expandCompositeSkill
};
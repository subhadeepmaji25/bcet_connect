// src/constants/appConstants.js
// Mirror of backend enums — single source of truth for frontend

export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  ALUMNI: "alumni",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  student: "Student",
  faculty: "Faculty",
  alumni: "Alumni",
  admin: "Admin",
};

export const ROLE_COLORS = {
  student: "badge-info",
  faculty: "badge-warning",
  alumni: "badge-success",
  admin: "badge-danger",
};

export const ACCOUNT_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
};

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];
export const SKILL_SOURCES = ["manual", "resume", "project", "certificate", "experience", "system"];

export const EDUCATION_LEVELS = ["diploma", "bachelor", "master", "phd", "other"];
export const GRADE_TYPES = ["cgpa", "percentage", "grade"];

export const EMPLOYMENT_TYPES_EXPERIENCE = [
  "internship", "full-time", "part-time", "freelance", "contract", "research", "volunteer", "other"
];

export const PROJECT_TYPES = ["academic", "personal", "hackathon", "freelance", "research", "open-source", "other"];
export const PROJECT_STATUS = ["planned", "in-progress", "completed"];
export const PROJECT_VISIBILITY = ["public", "private"];

export const JOB_CATEGORIES = [
  "software-engineering", "data-science", "machine-learning", "web-development",
  "mobile-development", "devops", "cybersecurity", "ui-ux", "product-management",
  "business-analyst", "research", "teaching", "other"
];

export const JOB_EMPLOYMENT_TYPES = [
  "full-time", "part-time", "internship", "contract", "freelance", "remote", "hybrid"
];

export const JOB_VISIBILITY = ["public", "campus-only", "branch-specific", "hidden"];
export const JOB_STATUS = ["pending", "approved", "rejected", "closed", "expired"];

export const APPLICATION_REVIEW_STATUSES = ["shortlisted", "rejected", "accepted"];

export const EXPERTISE_DOMAINS = [
  "backend", "frontend", "ai", "ml", "cloud", "devops", "dsa", "placement",
  "resume-review", "interview", "research", "higher-studies", "open-source", "system-design"
];

export const MENTORSHIP_TOPICS = [
  "placement", "resume", "career", "interview", "projects", "research", "higher-studies", "coding", "hackathon"
];

export const MEETING_MODES = ["online", "offline"];
export const SESSION_DURATIONS = [30, 45, 60, 90];
export const SUPPORTED_LANGUAGES = ["english", "hindi", "bengali", "tamil", "telugu", "marathi"];
export const AVAILABILITY_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const REQUEST_STATUS_COLORS = {
  pending: "badge-warning",
  accepted: "badge-success",
  rejected: "badge-danger",
  cancelled: "badge-neutral",
};

export const PROFILE_VISIBILITY = ["public", "private"];

// Username regex matching backend
export const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/;

// Category label map
export const JOB_CATEGORY_LABELS = {
  "software-engineering": "Software Engineering",
  "data-science": "Data Science",
  "machine-learning": "Machine Learning",
  "web-development": "Web Development",
  "mobile-development": "Mobile Development",
  "devops": "DevOps",
  "cybersecurity": "Cybersecurity",
  "ui-ux": "UI/UX Design",
  "product-management": "Product Management",
  "business-analyst": "Business Analyst",
  "research": "Research",
  "teaching": "Teaching",
  "other": "Other",
};

export const EMPLOYMENT_TYPE_LABELS = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  "internship": "Internship",
  "contract": "Contract",
  "freelance": "Freelance",
  "remote": "Remote",
  "hybrid": "Hybrid",
};

export const DOMAIN_LABELS = {
  "backend": "Backend",
  "frontend": "Frontend",
  "ai": "Artificial Intelligence",
  "ml": "Machine Learning",
  "cloud": "Cloud",
  "devops": "DevOps",
  "dsa": "DSA",
  "placement": "Placement",
  "resume-review": "Resume Review",
  "interview": "Interview Prep",
  "research": "Research",
  "higher-studies": "Higher Studies",
  "open-source": "Open Source",
  "system-design": "System Design",
};

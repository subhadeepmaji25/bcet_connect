// backend/src/modules/recommendation/utils/normalization.js
const SKILL_ALIASES = Object.freeze({
  // languages
  js: "javascript",
  ts: "typescript",
  "node.js": "nodejs",
  node: "nodejs",
  golang: "go",
  "c sharp": "c#",
  csharp: "c#",
  "c plus plus": "c++",
  cplusplus: "c++",
  py: "python",
  java: "java",
  kotlin: "kotlin",
  swift: "swift",
  ruby: "ruby",
  php: "php",
  rust: "rust",
  scala: "scala",
  dart: "dart",
  elixir: "elixir",
  clojure: "clojure",
  haskell: "haskell",
  rlang: "r",
  matlab: "matlab",
  perl: "perl",
  bash: "shell scripting",
  powershell: "powershell",
  sql: "sql",
  nosql: "nosql",
  html: "html",
  css: "css",
  scss: "sass",
  less: "less",
  // frontend
  "react.js": "react",
  reactjs: "react",
  "vue.js": "vue",
  vuejs: "vue",
  angularjs: "angular",
  "next.js": "nextjs",
  svelte: "svelte",
  tailwind: "tailwind css",
  bootstrap: "bootstrap",
  materialui: "material ui",
  chakraui: "chakra ui",
  redux: "redux",
  mobx: "mobx",
  recoil: "recoil",
  zustand: "zustand",
  graphqlclient: "apollo client",
  remix: "remix",
  gatsby: "gatsby",
  astro: "astro",
  nuxt: "nuxt",
  quasar: "quasar",
  // backend
  "express.js": "express",
  expressjs: "express",
  "spring boot": "springboot",
  "asp.net": "aspnet",
  dotnet_core: "dotnet",
  "rest api": "rest",
  "restful api": "rest",
  "restful apis": "rest",
  "graph ql": "graphql",
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  laravel: "laravel",
  symfony: "symfony",
  nestjs: "nestjs",
  koa: "koa",
  hapi: "hapi",
  springmvc: "spring mvc",
  micronaut: "micronaut",
  quarkus: "quarkus",
  rails: "ruby on rails",
  phoenix: "phoenix framework",
  gin: "gin gonic",
  echo: "echo framework",
  fiber: "fiber",
  // databases
  mongo: "mongodb",
  postgres: "postgresql",
  "postgre sql": "postgresql",
  "sql server": "mssql",
  "microsoft sql server": "mssql",
  mysql: "mysql",
  mariadb: "mariadb",
  redis: "redis",
  cassandra: "cassandra",
  couchdb: "couchdb",
  elasticsearch: "elasticsearch",
  dynamodb: "dynamodb",
  firestore: "firestore",
  supabase: "supabase",
  neo4j: "neo4j",
  cockroachdb: "cockroachdb",
  // cloud / devops
  aws: "amazon web services",
  "amazon web service": "amazon web services",
  gcp: "google cloud platform",
  "google cloud": "google cloud platform",
  azure: "microsoft azure",
  k8s: "kubernetes",
  "ci/cd": "cicd",
  "ci cd": "cicd",
  githubactions: "github actions",
  docker: "docker",
  jenkins: "jenkins",
  terraform: "terraform",
  ansible: "ansible",
  pulumi: "pulumi",
  helm: "helm",
  openshift: "openshift",
  serverless: "serverless",
  lambda: "aws lambda",
  ecr: "amazon ecr",
  eks: "amazon eks",
  gke: "google kubernetes engine",
  aks: "azure kubernetes service",
  cloudformation: "aws cloudformation",
  // data / ai
  ml: "machine learning",
  dl: "deep learning",
  ai: "artificial intelligence",
  nlp: "natural language processing",
  "scikit-learn": "scikit learn",
  sklearn: "scikit learn",
  cv: "computer vision",
  tensorflow: "tensorflow",
  pytorch: "pytorch",
  keras: "keras",
  huggingface: "hugging face",
  opencv: "opencv",
  pandas: "pandas",
  numpy: "numpy",
  spark: "apache spark",
  hadoop: "hadoop",
  airflow: "apache airflow",
  kafka: "apache kafka",
  flink: "apache flink",
  llm: "large language model",
  rag: "retrieval augmented generation",
  // mobile
  rn: "react native",
  "react native": "react native",
  flutter: "flutter",
  ionic: "ionic",
  xamarin: "xamarin",
  swiftui: "swiftui",
  kotlinmultiplatform: "kotlin multiplatform",
  // testing
  jest: "jest",
  mocha: "mocha",
  cypress: "cypress",
  selenium: "selenium",
  playwright: "playwright",
  junit: "junit",
  pytest: "pytest",
  postman: "postman",
  // versioning
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  svn: "subversion",
  // concepts
  dsa: "data structures and algorithms",
  oop: "object oriented programming",
  "oops": "object oriented programming",
  tdd: "test driven development",
  bdd: "behavior driven development",
  agile: "agile methodology",
  scrum: "scrum",
  devops: "devops",
  microservices: "microservices",
  soa: "service oriented architecture",
  monolith: "monolithic architecture",
  cqrs: "command query responsibility segregation",
  eventdriven: "event driven architecture",
  // other tools
  webpack: "webpack",
  vite: "vite",
  babel: "babel",
  eslint: "eslint",
  prettier: "prettier",
  nginx: "nginx",
  apache: "apache http server",
  rabbitmq: "rabbitmq",
  prometheus: "prometheus",
  grafana: "grafana",
  loki: "grafana loki",
  splunk: "splunk",
  datadog: "datadog",
  newrelic: "new relic",
  // frameworks
  hibernate: "hibernate",
  jpa: "jpa",
  entityframework: "entity framework",
  prisma: "prisma",
  typeorm: "typeorm",
  sequelize: "sequelize",
  mongoose: "mongoose",
  // security
  oauth: "oauth",
  jwt: "jwt",
  sso: "single sign on",
  encryption: "encryption",
  cybersecurity: "cyber security",
  penetrationtesting: "penetration testing",
  // design
  uiux: "ui ux design",
  figma: "figma",
  adobe: "adobe xd",
  sketch: "sketch",
  // misc
  linux: "linux",
  unix: "unix",
  windows: "windows",
  macos: "macos",
  websocket: "websocket",
  sse: "server sent events",
  grpc: "grpc",
  protobuf: "protocol buffers",
  openapi: "openapi",
  swagger: "swagger",
  solidity: "solidity",
  web3: "web3",
  blockchain: "blockchain",
  ethereum: "ethereum",
  aws: "amazon web services",
  azure: "microsoft azure",
  gcp: "google cloud platform",
  firebase: "firebase",
  heroku: "heroku",
  vercel: "vercel",
  netlify: "netlify",
  digitalocean: "digital ocean",
  linode: "linode",
  vultr: "vultr",
  cloudflare: "cloudflare",
  fastly: "fastly",
  cdn: "content delivery network",
  // additional languages
  fortran: "fortran",
  cobol: "cobol",
  lisp: "lisp",
  lua: "lua",
  erlang: "erlang",
  fsharp: "f#",
  vbnet: "vb.net",
  // additional frontend
  lit: "lit",
  alpinejs: "alpine js",
  htmx: "htmx",
  stimulus: "stimulus",
  // additional backend
  trpc: "trpc",
  tRPC: "trpc",
  supabase: "supabase",
  // additional devops
  argocd: "argo cd",
  fluxcd: "flux cd",
  tekton: "tekton",
  // additional data
  d3js: "d3.js",
  tableau: "tableau",
  powerbi: "power bi",
  qlik: "qlik",
  snowflake: "snowflake",
  bigquery: "bigquery",
  redshift: "redshift",
  // additional testing
  vitest: "vitest",
  testinglibrary: "testing library",
  // additional tools
  vscode: "visual studio code",
  intellij: "intellij idea",
  eclipse: "eclipse",
  pycharm: "pycharm",
  webstorm: "webstorm",
  postman: "postman",
  insomnia: "insomnia",
  // more concepts
  designpatterns: "design patterns",
  solidprinciples: "solid principles",
  dry: "dry principle",
  kiss: "kiss principle",
  yagni: "yagni",
  cleanarchitecture: "clean architecture",
  domaindrivendesign: "domain driven design",
  hexagonalarchitecture: "hexagonal architecture",
  // more
  graphql: "graphql",
  apollo: "apollo server",
  hasura: "hasura",
  strapi: "strapi",
  directus: "directus",
  sanity: "sanity io",
  contentful: "contentful",
  storybook: "storybook",
  chromatic: "chromatic",
  // more cloud
  iam: "identity and access management",
  vpc: "virtual private cloud",
  s3: "amazon s3",
  ec2: "amazon ec2",
  rds: "amazon rds",
  // more
  mlops: "mlops",
  aops: "aiops",
  dataengineering: "data engineering",
  datascientist: "data scientist",
  backenddev: "backend developer",
  frontenddev: "frontend developer",
  fulldev: "full stack developer",
  devsecops: "devsecops",
  sre: "site reliability engineering"
});
const COMPOSITE_SKILLS = Object.freeze({ mern: ["mongodb", "express", "react", "nodejs"], mean: ["mongodb", "express", "angular", "nodejs"], mevn: ["mongodb", "express", "vue", "nodejs"], lamp: ["linux", "apache", "mysql", "php"], lemp: ["linux", "nginx", "mysql", "php"], pern: ["postgresql", "express", "react", "nodejs"], jamstack: ["javascript", "apis", "markup"], t3: ["nextjs", "typescript", "tailwind", "trpc", "prisma"], django: ["python", "django", "postgresql", "redis"], rails: ["ruby", "rails", "postgresql", "redis"], larvel: ["php", "laravel", "mysql", "redis"], spring: ["java", "springboot", "postgresql", "maven"], dotnet: ["csharp", "aspnet", "mssql", "entityframework"], flutter: ["dart", "flutter", "firebase", "nodejs"], rn: ["reactnative", "expo", "firebase", "nodejs"], nextfull: ["nextjs", "typescript", "prisma", "tailwind", "nextauth"], sveltekit: ["svelte", "sveltekit", "supabase", "postgresql"], nuxt: ["vue", "nuxt", "pinia", "supabase"], astro: ["astro", "react", "tailwind", "vercel"], remix: ["remix", "react", "prisma", "postgresql"], solidstart: ["solidjs", "solidstart", "prisma", "postgresql"], qwick: ["qwik", "qwikcity", "supabase"], deno: ["deno", "fresh", "supabase"], bun: ["bun", "elysia", "react", "postgresql"], fastapi: ["python", "fastapi", "postgresql", "redis"], expressapi: ["nodejs", "express", "mongodb", "jwt"], nestjs: ["typescript", "nestjs", "typeorm", "postgresql"], micronaut: ["java", "micronaut", "postgresql"], quarkus: ["java", "quarkus", "postgresql"], gochi: ["golang", "chi", "postgresql", "redis"], fiber: ["golang", "fiber", "postgresql"], echo: ["golang", "echo", "postgresql"], gin: ["golang", "gin", "postgresql"], rustactix: ["rust", "actix", "postgresql", "sqlx"], axum: ["rust", "axum", "tokio", "postgresql"], phx: ["elixir", "phoenix", "postgresql", "ecto"], crystal: ["crystal", "lucky", "postgresql"], nim: ["nim", "jester", "postgresql"], kotlinktor: ["kotlin", "ktor", "postgresql"], scalaplay: ["scala", "playframework", "postgresql"], haskellyesod: ["haskell", "yesod", "postgresql"], ocaml: ["ocaml", "dream", "postgresql"], swiftvapor: ["swift", "vapor", "postgresql"], objc: ["objectivec", "cocoa", "sqlite"], cpprest: ["cpp", "restbed", "postgresql"], unity: ["unity", "csharp", "photon"], unreal: ["unreal", "cpp", "blueprints"], godot: ["godot", "gdscript", "csharp"], flutterweb: ["flutter", "web", "firebase"], ionic: ["ionic", "angular", "capacitor"], capacitor: ["capacitor", "react", "nodejs"], tauri: ["tauri", "rust", "svelte"], electron: ["electron", "react", "nodejs"], nwjs: ["nwjs", "react", "nodejs"], pwa: ["pwa", "react", "workbox"], serverless: ["awslambda", "apigateway", "dynamodb", "s3"], sam: ["aws", "sam", "lambda"], terraform: ["terraform", "aws", "kubernetes"], ansible: ["ansible", "aws", "docker"], puppet: ["puppet", "linux", "mysql"], chef: ["chef", "aws", "postgresql"], jenkins: ["jenkins", "docker", "kubernetes"], gitlabci: ["gitlab", "ci", "docker"], circleci: ["circleci", "kubernetes"], githubactions: ["github", "actions", "docker"], argocd: ["argocd", "kubernetes", "helm"], helm: ["helm", "kubernetes", "prometheus"], k8s: ["kubernetes", "docker", "istio"], dockercompose: ["docker", "compose", "nginx", "redis"], podman: ["podman", "quadlet", "kubernetes"], mlops: ["mlflow", "kubeflow", "tensorflow"], dvc: ["dvc", "git", "s3"], airflow: ["airflow", "python", "redis"], prefect: ["prefect", "python", "postgresql"], dagster: ["dagster", "python", "dbt"], dbt: ["dbt", "snowflake", "bigquery"], spark: ["spark", "hadoop", "scala"], flink: ["flink", "java", "kafka"], kafka: ["kafka", "zookeeper", "confluent"], pulsar: ["pulsar", "apache", "java"], rabbitmq: ["rabbitmq", "erlang", "spring"], redisstack: ["redis", "redisearch", "redisjson"], cassandra: ["cassandra", "java", "spark"], couchbase: ["couchbase", "nodejs", "java"], neo4j: ["neo4j", "cypher", "spring"], mongodbatlas: ["mongodb", "atlas", "realm"], firebase: ["firebase", "firestore", "auth"], supabase: ["supabase", "postgresql", "auth"], planetscale: ["planetscale", "mysql", "vitess"], neon: ["neon", "postgresql", "serverless"], cockroachdb: ["cockroachdb", "postgresql", "distributed"], yugabyte: ["yugabytedb", "postgresql", "distributed"], timescaledb: ["timescaledb", "postgresql", "timeseries"], influxdb: ["influxdb", "timeseries", "grafana"], prometheus: ["prometheus", "grafana", "alertmanager"], grafana: ["grafana", "prometheus", "loki"], elk: ["elasticsearch", "logstash", "kibana"], splunk: ["splunk", "monitoring"], newrelic: ["newrelic", "apm"], datadog: ["datadog", "monitoring"], sentry: ["sentry", "error", "tracking"], vercel: ["vercel", "nextjs", "edge"], netlify: ["netlify", "jamstack", "functions"], heroku: ["heroku", "postgres", "redis"], render: ["render", "web", "services"], railway: ["railway", "postgresql", "redis"], flyio: ["flyio", "docker", "postgres"], digitalocean: ["digitalocean", "appplatform", "kubernetes"], linode: ["linode", "akamai", "vps"], awsfull: ["aws", "ec2", "rds", "lambda", "s3"], azurefull: ["azure", "app", "service", "cosmosdb"], gcpfull: ["gcp", "compute", "cloudrun", "firestore"], oraclecloud: ["oracle", "cloud", "autonomous"], alibaba: ["alibaba", "ecs", "rds"], ibmcloud: ["ibm", "cloud", "watson"], salesforce: ["salesforce", "apex", "lightning"], servicenow: ["servicenow", "flow", "integration"], sap: ["sap", "hana", "abap"], oracleapex: ["oracle", "apex", "plsql"], wordpress: ["wordpress", "php", "mysql", "elementor"], shopify: ["shopify", "liquid", "nodejs"], magento: ["magento", "php", "mysql"], prestashop: ["prestashop", "php", "mysql"], drupal: ["drupal", "php", "mysql"], joomla: ["joomla", "php", "mysql"], strapi: ["strapi", "nodejs", "react", "postgresql"], sanity: ["sanity", "groq", "react"], contentful: ["contentful", "graphql", "react"], ghost: ["ghost", "nodejs", "mysql"], keystone: ["keystone", "nodejs", "react"], payload: ["payloadcms", "typescript", "mongodb"], directus: ["directus", "headless", "postgresql"], nocodb: ["nocodb", "airtable", "postgresql"], baserow: ["baserow", "airtable", "postgresql"], appsmith: ["appsmith", "lowcode", "postgresql"], tooljet: ["tooljet", "lowcode", "postgresql"], budibase: ["budibase", "lowcode", "postgresql"], n8n: ["n8n", "automation", "nodejs"], nodeRED: ["nodered", "iot", "flow"], huginn: ["huginn", "automation", "ruby"], make: ["make", "zapier", "automation"], zapier: ["zapier", "automation"], powerautomate: ["powerautomate", "microsoft"], airtable: ["airtable", "nocode"], notion: ["notion", "api", "automation"], coda: ["coda", "docs", "automation"], clickup: ["clickup", "project", "management"], monday: ["monday", "crm", "automation"], asana: ["asana", "project", "management"], jira: ["jira", "atlassian", "agile"], confluence: ["confluence", "docs"], linear: ["linear", "issue", "tracking"], height: ["height", "project", "management"], heightapp: ["height", "project"], figma: ["figma", "design", "prototyping"], adobexd: ["adobexd", "design"], sketch: ["sketch", "design", "mac"], framer: ["framer", "design", "motion"], webflow: ["webflow", "nocode", "design"], bubble: ["bubble", "nocode", "app"], adalo: ["adalo", "mobile", "nocode"], glide: ["glide", "apps", "google"], softr: ["softr", "airtable", "nocode"], stately: ["stately", "state", "machine"], xstate: ["xstate", "state", "machine"], zustand: ["zustand", "react", "state"], redux: ["redux", "react", "toolkit"], mobx: ["mobx", "react", "state"], pinia: ["pinia", "vue", "state"], ngrx: ["ngrx", "angular", "state"], akita: ["akita", "state"], jotai: ["jotai", "react", "atom"], recoil: ["recoil", "react", "state"], tanstack: ["tanstack", "query", "table"], swr: ["swr", "react", "data"], apollo: ["apollo", "graphql", "client"], urql: ["urql", "graphql"], relay: ["relay", "graphql", "facebook"], trpc: ["trpc", "typescript", "endtoend"], graphql: ["graphql", "apollo", "express"], restapi: ["rest", "express", "nodejs"], grpc: ["grpc", "protobuf", "go"], soap: ["soap", "xml", "enterprise"], openapi: ["openapi", "swagger", "codegen"], postman: ["postman", "api", "testing"], insomnia: ["insomnia", "api"], hoppscotch: ["hoppscotch", "api"], vitest: ["vitest", "testing", "vite"], jest: ["jest", "testing", "react"], cypress: ["cypress", "e2e", "testing"], playwright: ["playwright", "e2e"], selenium: ["selenium", "webdriver"], appium: ["appium", "mobile", "testing"], detox: ["detox", "reactnative", "testing"], maestro: ["maestro", "mobile", "testing"], k6: ["k6", "load", "testing"], jmeter: ["jmeter", "load", "testing"], locust: ["locust", "python", "load"], gatling: ["gatling", "scala", "load"], artillery: ["artillery", "nodejs", "load"], tailwind: ["tailwind", "css", "utility"], bootstrap: ["bootstrap", "css", "framework"], mui: ["mui", "react", "material"], chakra: ["chakra", "react", "ui"], antd: ["antd", "react", "design"], shadcn: ["shadcn", "ui", "tailwind"], daisyui: ["daisyui", "tailwind", "components"], flowbite: ["flowbite", "tailwind"], headlessui: ["headlessui", "react", "accessible"], radix: ["radix", "primitives", "ui"], framerMotion: ["framermotion", "react", "animation"], gsap: ["gsap", "animation", "js"], threejs: ["threejs", "webgl", "3d"], babylonjs: ["babylonjs", "3d", "webgl"], aframe: ["aframe", "webxr", "vr"], playcanvas: ["playcanvas", "3d", "game"], phaser: ["phaser", "html5", "game"], pixi: ["pixijs", "2d", "rendering"], konva: ["konva", "2d", "canvas"], fabric: ["fabricjs", "canvas"], p5: ["p5js", "creative", "coding"], tensorflowjs: ["tensorflowjs", "ml", "browser"], onnx: ["onnx", "ml", "runtime"], opencv: ["opencv", "computer", "vision"], dlib: ["dlib", "face", "recognition"], mediapipe: ["mediapipe", "google", "vision"], yolo: ["yolo", "object", "detection"], huggingface: ["huggingface", "transformers", "nlp"], langchain: ["langchain", "llm", "agents"], llamaIndex: ["llamaindex", "rag", "data"], crewai: ["crewai", "ai", "agents"], autogen: ["autogen", "microsoft", "agents"], openai: ["openai", "gpt", "api"], anthropic: ["anthropic", "claude", "api"], groq: ["groq", "fast", "inference"], togetherai: ["togetherai", "llm", "hosting"], replicate: ["replicate", "models", "inference"], fal: ["fal", "ai", "inference"], modal: ["modal", "gpu", "cloud"], runpod: ["runpod", "gpu", "rental"], vastai: ["vastai", "gpu", "marketplace"], lambda: ["lambdalabs", "gpu", "cloud"], coreweave: ["coreweave", "gpu", "cloud"], crusoe: ["crusoe", "gpu", "cloud"], nebius: ["nebius", "ai", "cloud"], fireworks: ["fireworks", "ai", "inference"], perplexity: ["perplexity", "search", "ai"], midjourney: ["midjourney", "image", "gen"], stablediffusion: ["stablediffusion", "image", "gen"], dalle: ["dalle", "openai", "image"], suno: ["suno", "music", "gen"], udio: ["udio", "music", "gen"], elevenlabs: ["elevenlabs", "voice", "cloning"], heygen: ["heygen", "avatar", "video"], synthesia: ["synthesia", "video", "ai"], descript: ["descript", "audio", "editing"], runway: ["runway", "video", "gen"], pika: ["pika", "video", "gen"], kling: ["kling", "video", "gen"], luma: ["luma", "dream", "machine"], genmo: ["genmo", "video", "gen"], viggle: ["viggle", "motion", "ai"], leonardo: ["leonardo", "image", "gen"], ideogram: ["ideogram", "text", "image"], flux: ["flux", "blackforest", "image"], sdxl: ["sdxl", "stability", "image"], comfyui: ["comfyui", "stable", "diffusion"], invokeai: ["invokeai", "stable", "diffusion"], automatic1111: ["automatic1111", "stable", "diffusion"], fooocus: ["fooocus", "image", "gen"] });
const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/[-_]/g, " ") // FIX: hyphens/underscores -> space BEFORE trimming,
    // so "react-native" and "react_native" both become "react native" and
    // hit the same alias/canonical path as the space-separated form.
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeSkillToken = (rawSkill) => {
  const cleaned = normalizeText(rawSkill).toLowerCase();
  if (!cleaned) return "";

  if (SKILL_ALIASES[cleaned]) {
    return SKILL_ALIASES[cleaned];
  }

  // Try dots removed entirely (handles "nodejs" already covered above,
  // but also catches odd forms like "n.o.d.e" -> unlikely but harmless).
  const dotsStripped = cleaned.replace(/\./g, "").trim();
  if (SKILL_ALIASES[dotsStripped]) {
    return SKILL_ALIASES[dotsStripped];
  }

  // Try dots converted to spaces (handles "asp.net" -> "asp net" already
  // covered above as an explicit alias, kept as a general fallback too).
  const dotsToSpace = cleaned.replace(/[._]/g, " ").replace(/\s+/g, " ").trim();
  if (SKILL_ALIASES[dotsToSpace]) {
    return SKILL_ALIASES[dotsToSpace];
  }

  // No alias found — return the cleaned form itself as canonical.
  return cleaned;
};

// Expands a single normalized token into its composite parts if it's a
// known stack acronym (mern/mean/mevn/lamp). Returns null if not composite.
const expandCompositeSkills = (rawSkill) => {
  const cleaned = normalizeText(rawSkill).toLowerCase();
  if (COMPOSITE_SKILLS[cleaned]) {
    return [...COMPOSITE_SKILLS[cleaned]];
  }
  return null;
};

const normalizeSkillList = (skills = []) => {
  if (!Array.isArray(skills)) return [];

  const normalized = skills
    .flatMap((skill) => (Array.isArray(skill) ? skill : [skill]))
    .flatMap((skill) => {
      const token = normalizeSkillToken(skill);
      const expanded = expandCompositeSkills(token);
      // Composite skills expand into their parts AND keep the acronym
      // itself (e.g. "mern" search intent should still match "mern").
      return expanded ? [token, ...expanded] : [token];
    })
    .filter((skill) => skill && skill.length <= 60);

  return [...new Set(normalized)];
};

const toSkillSet = (skills = []) => new Set(normalizeSkillList(skills));

module.exports = {
  SKILL_ALIASES,
  COMPOSITE_SKILLS,
  normalizeText,
  normalizeSkillToken,
  normalizeSkillList,
  expandCompositeSkills,
  toSkillSet
};
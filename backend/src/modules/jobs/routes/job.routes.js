// backend/src/modules/jobs/routes/job.routes.js
const express=require("express");
const router=express.Router();

const authMiddleware=require("../../../shared/middlewares/auth.middleware");
const{allowRoles}=require("../../../shared/middlewares/roleMiddleware");
const{jobActionLimiter}=require("../../../shared/security/rateLimiters");

const{
validateCreateJob,
validateUpdateJob,
validateRejectJob,
validateCloseJob,
validateReopenJob,
validateFeatureJob
}=require("../validators/job.validator");

const{
validateApplyJob,
validateReviewApplication
}=require("../validators/application.validator");

const{
createJobController,
updateJobController,
deleteJobController,
approveJobController,
rejectJobController,
closeJobController,
reopenJobController,
archiveJobController,
featureJobController,
verifyCompanyController,
getAnalyticsController,
getApprovedJobsController,
getPendingJobsController,
getMyJobsController,
getJobByIdController
}=require("../controllers/job.controller");

const{
applyForJobController,
withdrawApplicationController,
getMyApplicationsController,
getJobApplicationsController,
updateApplicationStatusController
}=require("../controllers/application.controller");

router.get("/",
authMiddleware,
getApprovedJobsController
);

router.get("/poster/my",
authMiddleware,
allowRoles("faculty","alumni","admin"),
getMyJobsController
);

router.get("/admin/pending",
authMiddleware,
allowRoles("admin"),
getPendingJobsController
);

router.get("/applications/my",
authMiddleware,
getMyApplicationsController
);

router.patch("/applications/:applicationId/withdraw",
authMiddleware,
withdrawApplicationController
);

router.patch("/applications/:applicationId/status",
authMiddleware,
allowRoles("faculty","alumni","admin"),
validateReviewApplication,
updateApplicationStatusController
);

router.post("/",
authMiddleware,
allowRoles("faculty","alumni","admin"),
jobActionLimiter,
validateCreateJob,
createJobController
);

router.patch("/:jobId",
authMiddleware,
allowRoles("faculty","alumni","admin"),
validateUpdateJob,
updateJobController
);

router.delete("/:jobId",
authMiddleware,
allowRoles("faculty","alumni","admin"),
deleteJobController
);

router.patch("/:jobId/approve",
authMiddleware,
allowRoles("admin"),
approveJobController
);

router.patch("/:jobId/reject",
authMiddleware,
allowRoles("admin"),
validateRejectJob,
rejectJobController
);

router.patch("/:jobId/close",
authMiddleware,
allowRoles("faculty","alumni","admin"),
validateCloseJob,
closeJobController
);

router.patch("/:jobId/reopen",
authMiddleware,
allowRoles("faculty","alumni","admin"),
validateReopenJob,
reopenJobController
);

router.patch("/:jobId/archive",
authMiddleware,
allowRoles("faculty","alumni","admin"),
archiveJobController
);

router.patch("/:jobId/feature",
authMiddleware,
allowRoles("admin"),
validateFeatureJob,
featureJobController
);

router.patch("/:jobId/verify-company",
authMiddleware,
allowRoles("admin"),
verifyCompanyController
);

router.get("/:jobId/analytics",
authMiddleware,
allowRoles("faculty","alumni","admin"),
getAnalyticsController
);

router.post("/:jobId/apply",
authMiddleware,
allowRoles("student","alumni"),
jobActionLimiter,
validateApplyJob,
applyForJobController
);

router.get("/:jobId/applications",
authMiddleware,
allowRoles("faculty","alumni","admin"),
getJobApplicationsController
);

router.get("/:jobId",
authMiddleware,
getJobByIdController
);

module.exports=router;

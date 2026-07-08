// backend/src/modules/connections/routes/connection.routes.js
const express=require("express");
const router=express.Router();
const authMiddleware=require("../../../shared/middlewares/auth.middleware");
const {connectionRequestLimiter}=require("../../../shared/security/rateLimiters");
const {validateSendRequest,validateRejectRequest,validateAcceptRequest,validateCancelRequest}=require("../validators/connection.validator");
const {sendRequestController,acceptRequestController,rejectRequestController,cancelRequestController,removeConnectionController,getMyConnectionsController,getReceivedRequestsController,getSentRequestsController,getConnectionStatusController}=require("../controllers/connection.controller");
router.post("/requests",authMiddleware,connectionRequestLimiter,validateSendRequest,sendRequestController);
router.get("/requests",authMiddleware,getReceivedRequestsController);
router.get("/requests/sent",authMiddleware,getSentRequestsController);
router.patch("/requests/:requestId/accept",authMiddleware,validateAcceptRequest,acceptRequestController);
router.patch("/requests/:requestId/reject",authMiddleware,validateRejectRequest,rejectRequestController);
router.patch("/requests/:requestId/cancel",authMiddleware,validateCancelRequest,cancelRequestController);
router.get("/connections",authMiddleware,getMyConnectionsController);
router.get("/connections/status/:userId",authMiddleware,getConnectionStatusController);
router.delete("/connections/:userId",authMiddleware,removeConnectionController);
module.exports=router;
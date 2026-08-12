const express=require("express");
const {isAuthenticated, isAdmin}=require("../middleware/authMiddleware");
const { getPendingApprovals, HandlePendingBookings, getPendingReassignments, reassignRoom } = require("../controllers/adminController");


const router=express.Router();

router.use(isAuthenticated, isAdmin);

router.get("/pending-approvals", getPendingApprovals)
router.put("/pending-approvals/:id", HandlePendingBookings)
router.get("/pending-reassignments", getPendingReassignments)
router.post("/reassign", reassignRoom)

module.exports=router;
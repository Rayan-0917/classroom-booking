const express=require("express");
const {isAuthenticated, isAdmin}=require("../middleware/authMiddleware");
const { getPendingApprovals, HandlePendingBookings, getPendingReassignments, reassignRoom } = require("../controllers/adminController");


const router=express.Router();

router.use(isAuthenticated, isAdmin);

router.get("/pending-approvals", getPendingApprovals)
router.put("/approve-booking/:id", HandlePendingBookings)
router.get("/reassignments", getPendingReassignments)
router.post("/reassign-room", reassignRoom)

module.exports=router;
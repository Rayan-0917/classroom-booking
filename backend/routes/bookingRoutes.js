const express=require("express");
const {isAuthenticated}=require("../middleware/authMiddleware");
const { getBookingsByDate, createBooking, getUserBookingsandReassignments, cancelBooking,  } = require("../controllers/bookingController");


const router=express.Router();

router.get("/", isAuthenticated, getBookingsByDate);
router.post("/", isAuthenticated, createBooking);
router.get("/my-bookings", getUserBookingsandReassignments);
router.delete("/", cancelBooking);

module.exports=router;
const express=require("express");
const {isAuthenticated}=require("../middleware/authMiddleware");
const { getBookingsByDate, createBooking } = require("../controllers/bookingController");


const router=express.Router();

router.get("/", isAuthenticated, getBookingsByDate);
router.post("/", isAuthenticated, createBooking);

module.exports=router;
const express=require("express");
const { getAllRooms } = require("../controllers/roomController");
const {isAuthenticated}=require("../middleware/authMiddleware")

const router=express.Router();

router.get("/", isAuthenticated, getAllRooms)

module.exports=router;
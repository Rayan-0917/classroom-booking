const express=require("express");
const passport=require("passport");
const { googleCallback, getUser, logout } = require("../controllers/authController");


const router=express.Router();

//login
router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}))

//google oauth callback
router.get("/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${process.env.CLIENT_URL}/login`,
    }),
    googleCallback
)

router.get("/me", getUser)

router.post("/logout", logout)

module.exports=router;
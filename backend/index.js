const express=require("express");
const cors=require("cors");
const session=require("express-session");
const passport=require("./config/passport");
const pool=require("./config/db");
const authRouter=require("./routes/authRoutes");
const roomRouter=require("./routes/roomRoutes");
const bookingRouter=require("./routes/bookingRoutes");
const adminRouter=require("./routes/adminRoutes");
require("dotenv").config();


const app=express();
app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL || "https://localhost:5173",
    credentials: true
}))

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24*60*60*1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRouter);
app.use("/rooms", roomRouter);
app.use("/bookings", bookingRouter);
app.use("/admin", adminRouter);


const PORT=5000
app.listen(PORT, ()=>{
    console.log(`server running at port ${PORT}`)
})
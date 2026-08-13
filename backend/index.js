const express=require("express");
const cors=require("cors");
const session=require("express-session");
require("dotenv").config();
const passport=require("./config/passport");
const pool=require("./config/db");
const authRouter=require("./routes/authRoutes");
const roomRouter=require("./routes/roomRoutes");
const bookingRouter=require("./routes/bookingRoutes");
const adminRouter=require("./routes/adminRoutes");



const app=express();
app.use(express.json());

if(process.env.NODE_ENV==="production"){
    app.set("trust proxy", 1);
}

const allowedOrigins=[
    "http://localhost:5173",
    "https://localhost:5000",
    process.env.CLIENT_URL
].filter(Boolean)

app.use(cors({
    origin: function(origin, callback){
        console.log("CORS request from:", origin);
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true)
        }
        else{
            console.log("Blocked CORS origin:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))



app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
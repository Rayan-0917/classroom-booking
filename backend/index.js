const express=require("express");
const cors=require("cors");
require("dotenv").config();
const app=express();

const PORT=5000
app.listen(PORT, ()=>{
    console.log(`server running at port ${PORT}`)
})
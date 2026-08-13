const Pool=require("pg").Pool

const pool=new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized: false
    }
})

pool.on("error", (err)=>{
    console.log("error: ", err)
})

module.exports=pool;
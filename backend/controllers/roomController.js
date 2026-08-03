const pool = require("../config/db")

const getAllRooms=async (req, res)=>{
    try {
        const result=await pool.query("SELECT id, room_number, is_high_priority, capacity FROM rooms");
        res.json({rooms: result.rows})
    } catch (error) {
        console.log("error: ", error);
        res.status(500).json({error: "could not fetch rooms"});
    }
};

module.exports={getAllRooms}
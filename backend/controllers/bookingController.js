const pool = require("../config/db");

const getBookingsByDate=async(req, res)=>{
    try {
        const {date}=req.query;

        if(!date){
            return res.status(400).json({error: "Date is required"});
        }

        const startOfDay=`${date} 00:00:00`;
        const endOfDay=`${date} 23:59:59`;

        const result=await pool.query("SELECT b.*, u.name AS booked_by_name, u.email AS booked_by_email, u.role AS booked_by_role, u.priority AS booked_by_priority FROM bookings b JOIN users u ON b.user_id=u.id WHERE b.start_time>=$1 AND b.end_time<=$2 AND b.status IN ('Approved', 'Pending') ORDER BY b.start_time ASC", [startOfDay, endOfDay]);

        res.json({date, bookings: result.rows})
    } catch (error) {
        console.log("error: ", error);
        res.status(500).json({error: "error fetching bookings"})
    }
}

const createBooking=async(req, res)=>{
    const client=await pool.connect();

    try {
        const {room_id, start_time, end_time}=req.body;
        const user_id=req.user.id;
        const user_priority=req.user.priority;
        
        if(!room_id || !start_time || !end_time){
            return res.status(400).json({error: "room_id, start time and end time required"})
        }

        const start=new Date(start_time);
        const end=new Date(end_time);

        if(start>=end){
            return res.status(400).json({error: "end time must be greater than start time"});
        }

        await client.query("BEGIN");
        const res=await client.query("SELECT room_number, is_high_priority FROM rooms WHERE id=$1", [room_id])

        if(res.rows.length===0){
            await client.query("ROLLBACK");
            return res.status(404).json({error: "Room not found"})
        }

        const isHighPriorityRoom=res.rows[0].is_high_priority;
        let newBookingStatus="Approved";
        if(isHighPriorityRoom && user_priority===1){
            newBookingStatus="Pending";
        }

        const ifExistingOverlap=await client.query("SELECT b.id, b.user_id, u.priority, u.name AS current_holder FROM bookings b JOIN users u ON b.user_id=u.id WHERE b.room_id=$1 AND b.status in ('Apprvoed', 'Pending') AND (b.start_time<$2 AND b.end_time>$3) FOR UPDATE", [room_id, start_time, end_time])

        if(ifExistingOverlap.rows.length>0){
            const currentBooking=ifExistingOverlap.rows[0];

            //less priority do nothing
            if(user_priority<=currentBooking.priority){
                await client.query("ROLLBACK");
                return res.status(400).json({error: `Slot is already booked by ${currentBooking.current_holder}`})
            }
            //high priority assign the room and reassign another room to previous person
            await client.query("UPDATE booking SET status='Reassigned' WHERE id=$1", [currentBooking.id]);

            await client.query("INSERT INTO reassignments (previous_booking_id, new_user_id, original_room_id, status) VALUES ($1, $2, $3, $4", [currentBooking.id, user_id, room_id, 'Pending']);
        }

        const newBooking=await client.query("INSERT INTO bookings (room_id, user_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *", [room_id, user_id, start_time, end_time, newBookingStatus])

        await client.query("COMMIT");

        res.status(201).json({message: newBooking==="Pending" ? "Booking made, awaiting admin approval" : "Room booked successfully", booking: newBooking.rows[0]});
    } catch (error) {
        await client.query("ROLLBACK");
        console.log(error);
    }
    finally{
        client.release();
    }
}

module.exports={getBookingsByDate, createBooking};
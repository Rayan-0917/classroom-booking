const pool = require("../config/db");

const getBookingsByDate = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "Date is required" });
        }

        const startOfDay = `${date} 00:00:00`;
        const endOfDay = `${date} 23:59:59`;

        const result = await pool.query("SELECT b.*, u.name AS booked_by_name, u.email AS booked_by_email, u.role AS booked_by_role, u.priority AS booked_by_priority FROM bookings b JOIN users u ON b.user_id=u.id WHERE b.start_time>=$1 AND b.end_time<=$2 AND b.status IN ('Approved', 'Pending') ORDER BY b.start_time ASC", [startOfDay, endOfDay]);

        res.json({ date, bookings: result.rows })
    } catch (error) {
        console.log("error: ", error);
        res.status(500).json({ error: "error fetching bookings" })
    }
}

const createBooking = async (req, res) => {
    const { room_id, start_time, end_time } = req.body;
    const user_id = req.user.id;
    const user_priority = req.user.priority;

    if (!room_id || !start_time || !end_time) {
        return res.status(400).json({ error: "room_id, start time and end time required" })
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (start >= end) {
        return res.status(400).json({ error: "end time must be greater than start time" });
    }

    const startMinutes = start.getMinutes();
    const endMinutes = end.getMinutes();
    const startSeconds = start.getSeconds();
    const endSeconds = end.getSeconds();

    if ((startMinutes !== 0 && startMinutes !== 30) || startSeconds !== 0 || (endMinutes !== 0 && endMinutes !== 30) || endSeconds !== 0) {
        return res.status(400).json({ error: "Violating 30 minute intervals" })
    }

    const duration = (end - start) / (60 * 1000);
    if (duration % 30 !== 0) {
        return res.status(400).json({ error: "Violating 30 minute intervals" })
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const ifExistingOverlap = await client.query("SELECT b.id, b.user_id, u.priority, u.name AS current_holder FROM bookings b JOIN users u ON b.user_id=u.id WHERE b.room_id=$1 AND b.status!='Cancelled' AND (b.start_time<$2 AND b.end_time>$3) FOR UPDATE", [room_id, end, start])

        if (ifExistingOverlap.rows.length > 0) {
            const currentBooking = ifExistingOverlap.rows[0];

            //less priority do nothing
            if (user_priority <= currentBooking.priority) {
                await client.query("ROLLBACK");
                return res.status(400).json({ error: `Slot is already booked by ${currentBooking.current_holder}` })
            }
            //high priority assign the room and reassign another room to previous person
            await client.query("UPDATE bookings SET status='Reassigned' WHERE id=$1", [currentBooking.id]);

            await client.query("INSERT INTO reassignments (previous_booking_id, new_user_id, original_room_id, status) VALUES ($1, $2, $3, $4)", [currentBooking.id, user_id, room_id, 'Pending']);
        }

        const roomRes = await client.query("SELECT room_number, is_high_priority FROM rooms WHERE id=$1", [room_id])

        if (roomRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Room not found" })
        }

        const isHighPriorityRoom = roomRes.rows[0].is_high_priority;
        let newBookingStatus = "Approved";
        if (isHighPriorityRoom && user_priority === 1) {
            newBookingStatus = "Pending";
        }

        const newBooking = await client.query("INSERT INTO bookings (room_id, user_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *", [room_id, user_id, start.toISOString(), end.toISOString(), newBookingStatus])

        await client.query("COMMIT");

        return res.status(201).json({ message: newBookingStatus === "Pending" ? "Booking made, awaiting admin approval" : "Room booked successfully", booking: newBooking.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        console.log(error);
        return res.status(500).json({error: "Server error"})
    }
    finally {
        client.release();
    }
}

const getUserBookingsandReassignments=async(req, res)=>{
    try {
        const user_id=req.user.id
        const bookingResult=await pool.query("SELECT b.*, r.id AS room_id, r.room_number, r.is_high_priority, r.capacity FROM bookings b JOIN rooms r ON b.room_id=r.id WHERE b.user_id=$1 AND b.status!='Cancelled' AND b.start_time > NOW() ORDER BY b.start_time ASC", [user_id])

        const reassignmentResult=await pool.query("SELECT re.id as reassignment_id, re.status as reassignment_status, orig_room.room_number AS original_room_number, orig_b.start_time AS start_time, orig_b.end_time AS end_time, new_u.name AS new_user_name, new_u.email as new_user_email, new_u.role as new_user_role, new_room.room_number as new_room_number FROM reassignments re JOIN bookings orig_b on re.previous_booking_id=orig_b.id JOIN rooms orig_room ON re.original_room_id=orig_room.id JOIN users new_u ON re.new_user_id=new_u.id LEFT JOIN rooms new_room ON re.new_room_id=new_room.id WHERE orig_b.user_id=$1 AND re.status='Pending' ORDER BY orig_b.start_time ASC", [user_id])

        return res.json({bookings: bookingResult.rows, reassignments: reassignmentResult.rows});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Failed to fetch bookings"})
    }
}

const cancelBooking=async(req, res)=>{
    const {id}=req.query;
    const user_id=req.user.id
    try{
        const result=await pool.query("UPDATE bookings SET status='Cancelled' WHERE id=$1 AND user_id=$2 RETURNING *", [id, user_id])

        if(result.rows.length===0){
            return res.status(404).json({error: "Booking not found."})
        }

        res.json({message: "Booking cancelled."})
    }
    catch{
        console.log(error);
        res.status(500).json({ error: "Failed to cancel booking" });
    }
}

module.exports = { getBookingsByDate, createBooking, getUserBookingsandReassignments, cancelBooking };
const pool=require("../config/db");

//get high priority rooms pending approval
const getPendingApprovals=async (req, res)=>{
    try {
        const result=await pool.query("SELECT b.id AS booking_id, b.start_time, b.end_time, b.created_at, r.id AS room_id, r.room_number, u.id AS user_id, u.name, u.email FROM bookings b JOIN rooms r ON b.room_id=r.id JOIN users u ON b.user_id=u.id WHERE b.status='Pending' AND r.is_high_priority=TRUE ORDER BY created_at ASC")

        res.json({pendingApprovals: result.rows});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
}

//approve or reject these high priority approvals
const HandlePendingBookings=async(req, res)=>{
    const {id}=req.params;
    const {decision}=req.body;

    try {
        const res=await pool.query("UPDATE bookings SET status=$1 WHERE id=$2 AND status='Pending' RETURNING *", [decision, id]);

        if(res.rows.length===0){
            return res.status(404).json("Pending booking not found");
        }

        res.json({
            booking: res.rows[0]
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to handle booking" });
    }
}

//get reassignments for assigning new rooms
const getPendingReassignments=async(req, res)=>{
    try {
        const query=`SELECT re.id as reassignment_id, re.status, re.created_at, b.id as original_booking_id, b.start_time, b.end_time, r.room_number, previous_u.name as previous_faculty_name, previous_u.email as previous_faculty_email, new_u.name as new_faculty_name 
        FROM reassignments re JOIN bookings b on re.previous_booking_id=b.id 
        JOIN rooms r on re.original_room_id=r.id 
        JOIN users previous_u ON b.user_id=previous_u.id 
        JOIN users new_u on re.new_user_id=new_u.id 
        WHERE re.status='Pending' ORDER BY re.created_at ASC`;

        const res=await pool.query(query);
        res.json({reassignments: res.rows});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch reassignments" });
    }
}

//assign new rooms to displaced faculty
const reassignRoom=async(req, res)=>{
    const client=await pool.connect();

    try {
        const {reassignment_id, new_room_id}=req.body;

        if(!reassignment_id || !new_room_id){
            return res.status(400).json({error: "Reassignment id and new room id needed"})
        }
        
        await client.query("BEGIN");

        const res=await client.query("SELECT re.*, b.user_id, b.start_time, b.end_time FROM reassignments re JOIN bookings b ON re.previous_booking_id=b.id WHERE re.id=$1 AND re.status='Pending' FOR UPDATE", [reassignment_id]);

        if(res.rows.length===0){
            await client.query("ROLLBACK");
            return res.status(400).json({error: "This reassignment was not found"});
        }

        const {user_id, start_time, end_time}=res.rows[0];

        const overlap=await client.query("SELECT id FROM bookings where room_id=$1 AND status IN ('Approved', 'Pending') AND (start_time < $2 AND end_time > $3)", [new_room_id, start_time, end_time]);

        if(overlap.rows.length>0){
            await client.query("ROLLBACK");
            return res.status(400).json({error: "The selected room for reassignment (new_room_id) has already been booked"});
        }

        const newBooking=await client.query("INSERT INTO bookings (room_id, user_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *", [new_room_id, user_id, start_time, end_time, 'Approved']);

        await client.query("UPDATE reassingments SET new_room_id=$1, status=$2 WHERE id=$3", [new_room_id, 'Resolved', reassignment_id]);

        await client.query("COMMIT");

        res.status(200).json({
            message: "Reassignment succesful",
            newBooking: newBooking.rows[0]
        })
    } catch (error) {
        await client.query("ROLLBACK");
        console.log(error);
        res.status(500).json({ error: "Failed to reassign room" });
    }
    finally{
        client.release()
    }
}

module.exports={
    getPendingApprovals,
    HandlePendingBookings,
    getPendingReassignments,
    reassignRoom
}
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import Feedback from '../components/Feedback';
import { CheckCircle2, X } from 'lucide-react';
import BookingGrid from '../components/BookingGrid';

const AdminDashboard = ({user}) => {
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [pendingReassignments, setPendingReassignments] = useState([])
  const [rooms, setRooms] = useState([])
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('approvals');
  const [selectedRoomMap, setSelectedRoomMap]=useState({});

  const fetchData = async () => {
    try {
      const [approvalRes, reassignmentRes, roomsRes] = await Promise.all([
        api.get("/admin/pending-approvals"),
        api.get("/admin/pending-reassignments"),
        api.get("/rooms")
      ])
      setPendingApprovals(approvalRes.data.pendingApprovals || [])
      setPendingReassignments(reassignmentRes.data.reassignments || []);
      setRooms(roomsRes.data.rooms || [])
    } catch (error) {
      console.log(error);
      setFeedbackMsg({ type: 'error', text: 'Failed to load admin dashboard data.' });
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateTime=(t)=>{
    const d=new Date(t);
    const date=d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
    let time=d.toLocaleDateString('en-US', {hour: '2-digit', minute: '2-digit', hour12: 'true'})
    time=time.split(", ")[1];
    return {date, time};
  }

  const handleApproval=async(bookingId, decision)=>{
    try {
      await api.put(`/admin/pending-approvals/${bookingId}`, {decision});
      setFeedbackMsg({type: "success", text: `Booking ${decision}`})
      fetchData();
    } catch (error) {
      console.log(error);
      setFeedbackMsg({type: "error", text: error.response?.data?.error || "Action Failed" })
    }
  }

  const handleReassignment=async(reassignment_id)=>{
    const newRoomId=selectedRoomMap[reassignment_id]
    if(!newRoomId){
      setFeedbackMsg({type: "error", text: "Please select a room first"})
    }
    try {
      await api.post("/admin/reassign", {
        reassignment_id: reassignment_id,
        new_room_id: newRoomId
      });
      setFeedbackMsg({type: "success", text: "Successfully reassigned room."})
    } catch (error) {
      console.log(error);
      setFeedbackMsg({type: "error", text: error.response?.data?.error || "Failed to reassign room."})
    }
  }

  return (
    <div className='max-w-7xl mx-auto p-4 space-y-8 md:p-6'>
      <div className='flex flex-col'>
        <div className='flex justify-between'>
          <h1 className='text-2xl font-bold'>Admin Control</h1>
          <button onClick={fetchData} className='p-2 text-white font-medium bg-blue-500 hover:bg-blue-600 transition rounded-xl cursor-pointer'>Refresh</button>
        </div>
      </div>

      {feedbackMsg && (
        <Feedback feedbackMsg={feedbackMsg} setFeedbackMsg={setFeedbackMsg} />
      )}

      <div className='flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 font-medium max-w-120'>
        <div className='p-2'>
          <button onClick={() => setActiveTab('approvals')} className={`px-3 py-1 rounded-lg cursor-pointer transition ${activeTab === 'approvals' ? "bg-blue-500 shadow-sm text-white font-semibold" : "text-gray-600"}`}>
          <span>Pending Approvals</span>
        </button>
        <button onClick={() => setActiveTab('reassignments')} className={`px-3 py-1 rounded-lg cursor-pointer transition ${activeTab === 'reassignments' ? "bg-blue-500 shadow-sm text-white font-semibold" : "text-gray-600"}`}>
          <span>Pending Reassignments</span>
        </button>
        <button onClick={() => setActiveTab('rooms')} className={`px-3 py-1 rounded-lg cursor-pointer transition ${activeTab === 'rooms' ? "bg-blue-500 shadow-sm text-white font-semibold" : "text-gray-600"}`}>
          <span>Rooms</span>
        </button>
        </div>
      </div>

      {activeTab==='approvals' && (
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='p-5 bg-gray-50 border-b border-gray-100'>
            <h1 className='text-xl font-bold'>High Priority room approvals</h1>
          </div>

          {loading ? (
            <div className='p-12 text-center font-medium'>Loading</div>
          ) : (
            pendingApprovals.length===0 ? (
              <div className='p-12 text-center flex justify-center items-center'>
                <div className='bg-green-400 border border-green-500 rounded-2xl shadow-sm items-center flex flex-row justify-center text-white px-4 py-2 gap-4'>
                  <CheckCircle2 className='w-6 h-6'/>
                  <p className='font-medium text-lg'>No pending approvals</p>
                </div>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                  <thead className='bg-white border border-gray-100'>
                    <tr>
                      <th className='px-6 py-3'>Faculty</th>
                      <th className='px-6 py-3'>Room</th>
                      <th className='px-6 py-3'>Date</th>
                      <th className='px-6 py-3'>Time</th>
                      <th className='px-6 py-3'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      pendingApprovals.map((approval)=>{
                        const start=formatDateTime(approval.start_time)
                        const end=formatDateTime(approval.end_time)

                        return (
                          <tr key={approval.booking_id} className='bg-white'>
                            <td className='px-6 py-3'>
                              <div className='font-medium'>{approval.name}</div>
                              <div className='font-light'>{approval.email}</div>
                            </td>
                            <td className='px-6 py-3 font-medium'>{approval.room_number}</td>
                            <td className='px-6 py-3 font-medium'>{start.date}</td>
                            <td className='px-6 py-3 font-medium'>{start.time} - {end.time}</td>
                            <td className='px-6 py-3 space-x-2'>
                              <button onClick={()=>handleApproval(approval.booking_id, 'Approved')} className='inline-flex items-center gap-1 px-3 py-1.5 font-medium bg-green-500 hover:bg-green-600 transition text-white border border-green-600 rounded-lg cursor-pointer'>
                                <CheckCircle2 className='w-4 h-4'/>
                                Approve
                              </button>
                              <button onClick={()=>handleApproval(approval.booking_id, 'Rejected')} className='inline-flex items-center gap-1 px-3 py-1.5 font-medium bg-red-500 hover:bg-red-600 transition text-white border border-red-600 rounded-lg cursor-pointer'>
                                <X className='w-4 h-4'/>
                                Reject
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {activeTab==='reassignments' && (
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='p-5 bg-gray-50 border-b border-gray-100'>
            <h1 className='text-xl font-bold'>Faculty Room Reassignment</h1>
          </div>

          {loading ? (
            <div className='p-12 text-center font-medium'>Loading</div>
          ) : (
            pendingReassignments.length===0 ? (
              <div className='p-12 text-center flex justify-center items-center'>
                <div className='bg-green-400 border border-green-500 rounded-2xl shadow-sm items-center flex flex-row justify-center text-white px-4 py-2 gap-4'>
                  <CheckCircle2 className='w-6 h-6'/>
                  <p className='font-medium text-lg'>No pending reassignments</p>
                </div>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                  <thead className='bg-white border border-gray-100'>
                    <tr>
                      <th className='px-6 py-3'>Displaced Faculty</th>
                      <th className='px-6 py-3'>Requested By</th>
                      <th className='px-6 py-3'>Room</th>
                      <th className='px-6 py-3'>Date</th>
                      <th className='px-6 py-3'>Time</th>
                      <th className='px-6 py-3'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReassignments.map((re)=>{
                        const start=formatDateTime(re.start_time)
                        const end=formatDateTime(re.end_time) 

                        return (
                          <tr key={re.reassignment_id} className='bg-white'>
                            <td className='px-6 py-3'>
                              <div className='font-medium'>{re.previous_faculty_name}</div>
                              <div className='font-light'>{re.previous_faculty_email}</div>
                            </td>
                            <td className='px-6 py-3 font-medium'>
                              <div className='font-medium'>{re.new_faculty_name}</div>
                              <div className='font-light'>{re.new_faculty_email}</div>
                            </td>
                            <td className='px-6 py-3 font-medium'>{re.room_number}</td>
                            <td className='px-6 py-3 font-medium'>{start.date}</td>
                            <td className='px-6 py-3 font-medium'>{start.time} - {end.time}</td>
                            <td className='px-6 py-3 space-x-2'>
                              <div className='flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100'>
                                <select value={selectedRoomMap[re.reassignment_id] || ''} onChange={(e)=>setSelectedRoomMap((prev)=>({
                                  ...prev,
                                  [re.reassignment_id]: e.target.value
                                }))} className='bg-white text-lg rounded-lg px-3 py-2 focuse:outline-none'>
                                  <option value="">-- Select New Room --</option>
                                  {rooms.filter((r)=>r.id!==re.original_room_id).map((r)=>(
                                    <option key={r.id} value={r.id}>
                                      Room {r.room_number} {r.is_high_priority ? '(High Priority)' : ''}
                                    </option>
                                  ))}
                                </select>

                                <button onClick={()=>handleReassignment(re.reassignment_id)} className='p-2 text-white font-medium bg-blue-500 hover:bg-blue-600 transition rounded-xl cursor-pointer'>
                                  Assign Room
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {activeTab==='rooms' && (
        <div className='pt-2'>
          <BookingGrid user={user}/>
        </div>
      )}

    </div>
  )
}

export default AdminDashboard

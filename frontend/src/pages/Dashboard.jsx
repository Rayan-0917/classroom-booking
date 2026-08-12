import React from 'react'
import BookingGrid from '../components/BookingGrid'
import { useState } from 'react'
import api from '../services/api'
import { useEffect } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Feedback from '../components/Feedback'

const Dashboard = ({user}) => {
  const [myBookings, setMyBookings]=useState([])
  const [reassignments, setReassignments]=useState([])
  const [loading, setLoading]=useState(true);
  const [feedbackMsg, setFeedbackMsg]=useState(null);

  const fetchDashboardData=async()=>{
    try {
      const res=await api.get("/bookings/my-bookings");
      setMyBookings(res.data.bookings || []);
      setReassignments(res.data.reassignments || [])
    } catch (error) {
      console.log(error);
    }
    finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    fetchDashboardData();
  }, [user])

  const formatDateTime=(t)=>{
    const d=new Date(t);
    const date=d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
    let time=d.toLocaleDateString('en-US', {hour: '2-digit', minute: '2-digit', hour12: 'true'})
    time=time.split(", ")[1];
    return {date, time};
  }

  const cancelBooking=async(bookingId)=>{
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.delete(`/bookings?id=${bookingId}`);
      setFeedbackMsg({type: "success", text: "Booking cancelled succesfully."})
      fetchDashboardData()
    } catch (error) {
      console.log(error);
      setFeedbackMsg({type: "error", text: error.response?.data?.error || "Failed to cancel booking."})
    }
  }

  // console.log(reassignments)
  return (
    <div className='max-w-7xl mx-auto p-4 space-y-8 md:p-6'>
      <div className='flex flex-col'>
        <div>
          <h1 className='text-2xl font-bold'>
            Welcome, {user?.name || 'User'}
          </h1>
        </div>
      </div>

      {feedbackMsg && (
        <div className='p-4'>
          <Feedback feedbackMsg={feedbackMsg} setFeedbackMsg={setFeedbackMsg}/>
        </div>
      )}

      {reassignments.length>0 && (
        <div className='bg-amber-200 border border-amber-500 rounded-2xl p-5 shadow-sm space-y-3'>
          <div className='flex items-center gap-2 text-amber-700 font-medium'>
            <AlertTriangle className='w-5 h-5 text-amber-700'/>
            <h2 className='text-xl'>Room Reassignment Notification</h2>
          </div>
          <p>Your booking will be reassigned due to a request from a higher priority faculty.</p>
          <div className='grid grid-cols-1'>
            {reassignments.map((re)=>(
              <div key={re.reassignment_id} className='bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between shadow-sm'>
                <div>
                  <div>
                    <span className='font-bold'>Requested By: </span> {re.new_user_name} ({re.new_user_role}) | {re.new_user_email}
                  </div>
                  <div>
                    <span className='font-medium'>Original Room: </span>{re.original_room_number} | <span className='font-medium'>New Room: </span> {re.new_room_number || 'Waiting for reassignment.'}
                  </div>
                  <div><span className='font-medium'>Status: </span> {re.reassignment_status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='bg-gray-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
        <div className='p-6 border-b border-gray-100 flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-bold'>Upcoming Bookings</h2>
          </div>
          <button onClick={fetchDashboardData} className='p-2 text-white font-medium bg-blue-500 hover:bg-blue-600 transition rounded-xl cursor-pointer'>Refresh</button>
        </div>
        {loading ? (
          <div className='p-12 text-center font-medium'>Loading</div>
        ) : myBookings.length===0 ? (
          <div className='p-12 text-center'>
            <p className='font-medium'>No upcoming booking found.</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left'>
              <thead className='bg-white border border-gray-100'>
                <tr>
                  <th className='px-6 py-3'>Room</th>
                  <th className='px-6 py-3'>Date</th>
                  <th className='px-6 py-3'>Time</th>
                  <th className='px-6 py-3'>Status</th>
                  <th className='px-6 py-3'>Action</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b)=>{
                  const start=formatDateTime(b.start_time)
                  const end=formatDateTime(b.end_time)

                  return (
                    <tr key={b.id} className='bg-white'>
                      <td className='px-6 py-3 font-semibold flex items-center gap-2'>
                        Room {b.room_number}
                        {b.is_high_priority && (
                          <span className='text-xs bg-amber-100 text-amber-400 border border-amber-300 px-1.5 py-0.5 rounded-full'>High Priority</span>
                        )}
                      </td>
                      <td className='px-6 py-4 font-medium'>{start.date}</td>
                      <td className='px-6 py-4 font-medium'>{start.time} - {end.time}</td>
                      <td className='px-6 py-4'>
                        {(()=>{
                          switch(b.status){
                            case 'Approved': 
                              return (
                                <span className='font-medium px-2.5 py-1 rounded-lg bg-green-500 text-white border border-green-600'>Approved</span>
                              )
                            case 'Pending':
                              return (
                                <span className='font-medium px-2.5 py-1 rounded-lg bg-amber-500 text-white border border-amber-600'>Pending Approval</span>
                              )
                            case 'Reassigned':
                              return (
                                <span className='font-medium px-2.5 py-1 rounded-lg bg-orange-500 text-white border border-orange-600'>Reassigned</span>
                              )
                            case 'Rejected': 
                              return (
                                <span className='font-medium px-2.5 py-1 rounded-lg bg-red-500 text-white border border-red-600'>Rejected</span>
                              )
                            default: 
                              return (
                                <span className='font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-white border border-gray-200'>{b.status}</span>
                              )
                          }
                        })()}
                      </td>
                      <td className='px-6 py-4'>
                        <button onClick={()=>cancelBooking(b.id)} className='inline-flex items-center gap-1 px-3 py-1.5 font-medium bg-red-500 hover:bg-red-600 transition text-white border border-red-600 rounded-lg cursor-pointer'>
                          <Trash2 className='w-4 h-4'/> Cancel Booking
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BookingGrid user={user}/>
    </div>
  )
}

export default Dashboard

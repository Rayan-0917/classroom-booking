import React from 'react'
import api from '../services/api'
import { useState } from 'react';
import { useEffect } from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Feedback from './Feedback';

const generateTimeSlots=()=>{
    const slots=[];
    for(let hour=8; hour<20; hour++){
        for(let min=0; min<60; min+=30){
            const startH=hour.toString().padStart(2, "0");
            const startM=min.toString().padStart(2, "0");

            const nextMin=(min+30)%60;
            const nextHour=min+30>=60 ? hour+1 : hour;
            const endH=nextHour.toString().padStart(2, "0")
            const endM=nextMin.toString().padStart(2, "0")

            const formatAmPm=(h, m)=>{
                const hInt=parseInt(h, 10);
                const displayH=hInt%12===0 ? 12 : hInt%12;
                const ampm=hInt>=12 ? "PM": "AM"
                return `${displayH}:${m} ${ampm}`;
            }

            slots.push({
                id: `${startH}:${startM}`,
                timeStr:`${startH}:${startM}`,
                endStr: `${endH}:${endM}`,
                label: `${startH}:${startM} - ${endH}:${endM}`,
                displayLabel: `${formatAmPm(startH, startM)} - ${formatAmPm(endH, endM)}`
            })
        }
    }
    return slots;
}

const time_slots=generateTimeSlots();

const BookingGrid = ({user}) => {

    const [selectedDate, setSelectedDate]=useState(new Date().toLocaleDateString('sv-SE').split("T")[0]);
    const [rooms, setRooms]=useState([]);
    const [bookings, setBookings]=useState([]);
    const [loading, setLoading]=useState(true);
    const [filterType, setFilterType]=useState("all");
    const [feedbackMsg, setFeedbackMsg]=useState(null);
    const [selectedRoom, setSelectedRoom]=useState(null);
    const [selectedSlots, setSelectedSlots]=useState([])
    const [bookingLoading, setBookingLoading]=useState(false);

    const fetchRoomsAndBookings=async()=>{
        setLoading(true);
        try{
            const [roomsRes, bookingsRes]=await Promise.all([
                api.get("/rooms"),
                api.get(`/bookings?date=${selectedDate}`)
            ]);
            setRooms(roomsRes.data.rooms);
            setBookings(bookingsRes.data.bookings);
        }
        catch(error){
            console.log(error);
            setFeedbackMsg({
                type: "error",
                text: "Error loading rooms and slots."
            })
        }
        finally{
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchRoomsAndBookings()
    }, [selectedDate])

    const getSlotDetails=(roomId, timeStr)=>{
        const slotStart=new Date(`${selectedDate}T${timeStr}:00`);
        const slotEnd=new Date(slotStart.getTime() + 30*60*1000);

        return bookings.find((b)=>{
            if(b.room_id!==roomId){
                return false;
            }
            const bStart=new Date(b.start_time);
            const bEnd=new Date(b.end_time);
            return slotStart<bEnd && slotEnd>bStart && b.status!=="Cancelled";
        })
    }

    const shiftDate=(days)=>{
        const current=new Date(selectedDate);
        current.setDate(current.getDate()+days);
        setSelectedDate(current.toISOString().split("T")[0]);
    }

    const filteredRooms=rooms.filter((r)=>{
        if(filterType==="high") return r.is_high_priority;
        if(filterType==="standard") return !r.is_high_priority;
        return true;
    })

    const handleSlotSelection=(room, slot)=>{
        const existingBooking=getSlotDetails(room.id, slot.timeStr);

        if(existingBooking){
            if(existingBooking.user_id===user.id){
                setFeedbackMsg({type: "error", text: "You have already booked this slot."})
                return;
            }
            if(user.priority<=(existingBooking.booked_by_priority || 1)){
                setFeedbackMsg({type: "error", text: "Slot has been booked by someone else."})
                return;
            }
            setFeedbackMsg({type: "info", text: `The slot is booked by ${existingBooking.booked_by_name}. Confirming will reassign their booking.`})
        }

        if(selectedRoom && selectedRoom.id!==room.id){
            setSelectedRoom(room);
            setSelectedSlots([slot]);
            return;
        }

        setSelectedRoom(room);

        //clicking on selected slot 
        const isSlotSelected=selectedSlots.some((s)=>s.id===slot.id);
        if(isSlotSelected){
            const updatedSlots=selectedSlots.filter((s)=>s.id!==slot.id);
            if(updatedSlots.length===0){
                setSelectedRoom(null);
            }
            setSelectedSlots(updatedSlots);
            return;
        }

        const newSlots=[...selectedSlots, slot].sort(
            (a, b)=>a.timeStr.localeCompare(b.timeStr)
        )

        let isContinuous=true;
        for(let i=0; i<newSlots.length-1; i++){
            if(newSlots[i].endStr!==newSlots[i+1].timeStr){
                isContinuous=false;
                break;
            }
        }

        if(!isContinuous){
            setFeedbackMsg({type: "error", text: "Please select consecutive slots (or make separate bookings for non continuous slots."});
            setSelectedSlots([slot]);
            return;
        }
        setSelectedSlots(newSlots);
        setFeedbackMsg(null);

    }

    const getSelectedSlotsRange=()=>{
        if(selectedSlots.length===0){
            return ""
        }
        const first=selectedSlots[0];
        const last=selectedSlots[selectedSlots.length-1];
        const duration=selectedSlots.length*30;
        let hours=0;
        let mins=0;
        if(duration>=30){
            hours=duration/60 >=1 ? Math.trunc(duration/60) : 0;
            if(duration % 60!==0){
                mins=30;
            }
        }
        let time="";
        if(hours!==0 && mins!==0){
            time=`${hours} Hrs ${mins} Mins`
        }
        else if(mins===0){
            time=`${hours} Hrs`
        }
        else if(hours===0){
            time=`${mins} Mins`
        }
        return `${first.timeStr} - ${last.endStr} (${time})`;
    }

    const confirmBooking=async()=>{
        if(!selectedRoom || selectedSlots.length===0){
            return;
        }
        setBookingLoading(true);

        const firstSlot=selectedSlots[0];
        const lastSlot=selectedSlots[selectedSlots.length-1];

        const start=new Date(`${selectedDate}T${firstSlot.timeStr}:00`);
        const end=new Date(`${selectedDate}T${lastSlot.endStr}:00`)

        try {
            const res=await api.post("/bookings", {
                room_id: selectedRoom.id,
                start_time: start.toISOString(),
                end_time: end.toISOString()
            })

            setFeedbackMsg({type: "success", text: res.data.message || `Room ${selectedRoom.room_number} booked.`})
            setSelectedRoom(null);
            setSelectedSlots([]);
            fetchRoomsAndBookings();
        } catch (error) {
            setFeedbackMsg({type: "error", text: error.response?.data?.error || "Failed to complete booking, please try again later."})
        }
        finally{
            setBookingLoading(false);
        }
    }

  return (
    <div>
      <div className='bg-white rounded-2xl border border-gray-50 shadow-sm'>
        <div className='flex flex-col p-6 bg-gray-50 md:flex-row md:items-center justify-between gap-4 mb-3 border-b border-gray-100'>
            <div className='mb-6'>
                <h2 className='text-xl font-bold '>
                    Available Rooms and Slots
                </h2>
            </div>
            <div className='flex flex-wrap items-center gap-3 mb-6'>
                <div className='flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200'>
                    <button onClick={()=>shiftDate(-1)} className='p-1.5 rounded-lg cursor-pointer'>
                        <ChevronLeft className='w-6 h-6'/>
                    </button>
                    <input type="data" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className='bg-transparent font-semibold px-2 focus:outline-none cursor-pointer'/>
                    <button onClick={()=>shiftDate(1)} className='p-1.5 rounded-lg cursor-pointer'>
                        <ChevronRight className='w-6 h-6'/>
                    </button>
                </div>
                <div className='flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 font-medium'>
                    <button onClick={()=>setFilterType("all")} className={`px-3 py-1 rounded-lg cursor-pointer transition ${filterType==="all" ? "bg-white shadow-sm text-gray-900 font-semibold" : "text-gray-600"}`}>All Rooms (20)</button>
                    <button onClick={()=>setFilterType("high")} className={`px-3 py-1 rounded-lg cursor-pointer transition ${filterType==="high" ? "bg-white shadow-sm text-amber-500 font-semibold" : "text-gray-600"}`}>High Priority Rooms (6)</button>
                    <button onClick={()=>setFilterType("standard")} className={`px-3 py-1 rounded-lg cursor-pointer transition ${filterType==="standard" ? "bg-white shadow-sm text-gray-900 font-semibold" : "text-gray-600"}`}>Standard Rooms (14)</button>

                </div>
            </div>
        </div>
        {feedbackMsg && (
            <div className='p-4'>
                <Feedback feedbackMsg={feedbackMsg} setFeedbackMsg={setFeedbackMsg}/>
            </div>
        )}
        <div className='flex items-center gap-10 mb-4 mt-10 font-medium p-4 '>
            <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded bg-green-200 border border-green-400'></div>
                <span>Available</span>
            </div>
            <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded bg-blue-500 border border-gray-100'></div>
                <span>Your Booking</span>
            </div>
            <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded bg-red-500 border border-gray-100'></div>
                <span>Occupied</span>
            </div>
            <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded bg-amber-500 border border-gray-100'></div>
                <span>High Priority Rooms</span>
            </div>
        </div>

        {loading ? (
            <div className='p-12 text-center font-medium'>Loading</div>
        ) : (
            rooms.length===0 ? (
                <div className='p-8 text-center font-medium'>No rooms available</div>
            ) : (
                <div className='space-y-4 p-6'>
                    {filteredRooms.map((room)=>(
                        <div key={room.id} className='border border-gray-100 rounded-xl p-10 bg-white shadow-sm hover:border-gray-200 transition'>
                            <div className='flex items-center justify-between border-b border-gray-100 pb-3 mb-3'>
                                <div className='flex items-center gap-2'>
                                    <span className='font-bold'>
                                        Room {room.room_number}
                                    </span>
                                    {room.is_high_priority && (
                                        <span className='inline-flex items-center gap-1 text-[10px] bg-amber-200 text-amber-500 px-2 py-0.5 rounded-full border border-amber-600'>
                                            High Priority
                                        </span>
                                    )}
                                </div>
                                <div className='flex items-center'>
                                    <span>Capacity: {room.capacity}</span>
                                </div>
                            </div>

                            <div className='flex flex-wrap gap-2'>
                                {time_slots.map((slot)=>{
                                    const booking=getSlotDetails(room.id, slot.timeStr);
                                    const isMine=booking && booking.user_id===user.id;
                                    const isPending=booking && booking.status==="Pending";
                                    // console.log(selectedSlots)
                                    const isSelected=selectedRoom && selectedRoom?.id===room.id && selectedSlots?.some((s)=>s?.id===slot.id) 
                                    // console.log(selectedSlots[0].id)
                                    // console.log(selectedSlots[1].id)

                                    let style="border-green-400 bg-green-200 hover:bg-green-400 cursor-pointer"
                                    if(booking){
                                        if(isMine){
                                            style="bg-blue-500 border-blue-600 text-white font-medium shadow-sm cursor-not-allowed"
                                        }
                                        else if(isPending){
                                            style="bg-amber-500 border-amber-600 text-amber-900 font-medium shadow-sm cursor-not-allowed"
                                        }
                                        else{
                                            style=user.priority>1 ? "bg-gray-100 border-gray-200 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer" : "bg-red-500 border-red-600 text-white cursor-not-allowed"
                                        }
                                    }
                                    else if(isSelected){
                                        style="bg-blue-200 border border-blue-300 hover:bg-blue-300 transition"
                                    }
                                    else if(room.is_high_priority){
                                        style="bg-amber-400 border-amber-500 hover:bg-amber-500 cursor-pointer"
                                    }

                                    return (
                                        <button onClick={()=>handleSlotSelection(room, slot)} key={slot.id} className={`px-3 py-2 rounded-xl border font-medium transition flex flex-col items-center justify-center min-w-19 ${style}`}>
                                            <span>{slot.timeStr} - {slot.endStr}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )
        )}
        {selectedRoom && selectedSlots.length>0 && (
            <div className='sticky w-xl bottom-6 bg-gray-200 p-4 rounded-xl shadow-sm flex flex-col'>
                <div className='flex items-center gap-3'>
                    <div>
                        <div className='font-medium'>
                            Room {selectedRoom.room_number} | {selectedDate}
                        </div>
                        <div className='font-medium'>
                            <span>Time: {getSelectedSlotsRange()}</span>
                        </div>
                    </div>
                </div>
                
                <div className='flex items-center gap-3 w-full sm:w-auto mt-4'>
                    <button className='px-4 py-2 font-medium' onClick={()=>{
                        setSelectedRoom(null);
                        setSelectedSlots([]);
                    }}>
                        Clear Selection
                    </button>
                    <button onClick={confirmBooking} disabled={bookingLoading} className='w-full sm:w-auto px-6 py-2 bg-blue-400 hover:bg-blue-600 transition text-white font-semibold shadow-lg rounded-xl'>
                        {bookingLoading ? "Procesing" : "Confirm Booking"}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}

export default BookingGrid

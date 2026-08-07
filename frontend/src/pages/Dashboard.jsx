import React from 'react'
import BookingGrid from '../components/BookingGrid'

const Dashboard = ({user}) => {
  return (
    <div>
      <BookingGrid user={user}/>
    </div>
  )
}

export default Dashboard

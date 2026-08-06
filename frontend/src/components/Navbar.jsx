import { LogOut, User } from 'lucide-react';
import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            setUser(null);
            navigate("/login")
        }
        catch (err) {
            console.log(error);
        }
    }

    return (
        <nav className='bg-blue-500 text-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky'>
            <div className='flex items-center space-x-6'>
                <div className='text-2xl font-bold flex items-center gap-2'>
                    <span>Classroom Booking</span>
                </div>
            </div>

            {user && (
                <div className='flex items-center space-x-6'>
                    <div className='flex items-center gap-2'>
                        <User className='w-4 h-4' />
                        <span className='font-semibold'>{user.name}</span>
                        <span className='text-xs px-2 py-0.5'>{user.role}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 rounded-lg">
                        <LogOut className='w-5 h-5' />
                    </button>
                </div>
            )}
        </nav>
    )
}

export default Navbar
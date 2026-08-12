import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar.jsx'
import api from './services/api.js';
import { useEffect } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function App() {
  const [user, setUser]=useState(null);
  const [loading, setLoading]=useState(true);

  const getUser=async()=>{
    try {
      const res=await api.get("/auth/me").then((res)=>{
        if(res.data.authenticated){
          setUser(res.data.user);
        }
      })
    } catch (error) {
        console.log(error);
    }
    finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    getUser()
  }, [])

  if(loading){
    return (
      <div className='min-h-screen flex items-center justify-center'>Loading</div>
    )
  }

  return (
      <BrowserRouter>
        <Navbar user={user} setUser={setUser}/>
        <Routes>
          <Route path='/login' element={!user ? <Login/> : user.role==='Admin' ? <Navigate to="/admin" replace/> : <Navigate to="/dashboard" replace/>}/>
          <Route path='/dashboard' element={user ? <Dashboard user={user}/> : <Navigate to="/login" replace/>}/>
          <Route path='/admin' element={user && user.role==="Admin" ? <AdminDashboard user={user}/> : <Navigate to="/login" replace/>}/>

          <Route path="*" element={!user ? <Navigate to="/login" replace /> : user.role === 'Admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />}/>
        </Routes>
      </BrowserRouter>
  )
}

export default App

import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar.jsx'
import api from './services/api.js';
import { useEffect } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

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
  }

  useEffect(()=>{
    getUser()
    setLoading(false);
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
          <Route path='/login' element={<Login/>}/>
          <Route path='/dashboard' element={<Dashboard/>}/>
        </Routes>
      </BrowserRouter>
  )
}

export default App

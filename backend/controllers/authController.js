const googleCallback=(req, res)=>{
    if(req.user && req.user.role==='Admin'){
        return res.redirect(`${process.env.CLIENT_URL}/admin`)
    }
    res.redirect(`${process.env.CLIENT_URL}/dashboard`)
}

const getUser=(req, res)=>{
    if(req.isAuthenticated()){
        return res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                priority: req.user.priority
            }
        })
    }

    return res.status(401).json({authenticated: false, message: "No active session"})
}

const logout=(req, res, next)=>{
    req.logout((err)=>{
        if(err) return(next(err));
        req.session.destroy(()=>{
            res.clearCookie("connect.sid")
            return res.status(200).json({message: "logged out"})
        })
    })
}

module.exports={
    googleCallback, 
    getUser,
    logout
}
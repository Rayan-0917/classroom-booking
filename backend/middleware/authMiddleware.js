function isAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    return res.status(402).json({message: "Unauthorized. Please log in first."})
}

function isAdmin(req, res, next){
    if(req.isAuthenticated() && (req.user.role==="Admin")){
        return next();
    }
    return res.status(403).json({ message: "Forbidden. Only Admins allowed." });
}

module.exports={isAuthenticated, isAdmin}
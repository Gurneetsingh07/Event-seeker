const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
   let token=req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1]:null;
   if(token){
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if(!req.user){
            return res.status(401).json({message:'Not authorized as user'}) 
        }
        next();
    } catch (error) {
        return res.status(401).json({message:'Not authorized'})  
    }
   } else{ 
    return res.status(401).json({message:'No token'}) 
   } 

};

const admin= async(req,res,next)=>{
  if(req.user && req.user.role==='admin'){
    next()
  }else{
    return res.status(403).json({message:'Not authorized as admin'})  
  }
}   
module.exports = {protect,admin};

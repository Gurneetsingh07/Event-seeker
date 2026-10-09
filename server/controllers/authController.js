const User = require("../models/User");
const OTP = require("../models/OTP");
const { sendOTPEmail } = require("../utils/email");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generatetoken=(id,role)=>{
  return jwt.sign({id,role},process.env.JWT_SECRET,{expiresIn:"7d"})
}

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      isVerified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp, action: "account_verification" });
    await sendOTPEmail(email, otp, "account_verification");

    return res.status(201).json({
      message: "User registered successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Error registering user" });
  }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid credential Please sign up first" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credential Please enter correct password" });
    }

    if (!user.isVerified && user.role === "user") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await OTP.deleteMany({ email, action: "account_verification" });
      await OTP.create({ email, otp, action: "account_verification" });
      await sendOTPEmail(email, otp, "account_verification");
      return res.status(200).json({
        error: "Account not verified. A new OTP has been sent to your email",
      });
    }

    res.json({
      message: "Login successfully",
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generatetoken(user._id,user.role),
    })
  };

  exports.verifyOtp = async (req, res) => {
    const {email,otp} = req.body;
    const optRecord = await OTP.findOne({email,otp,action:"account_verification"});
    if(!optRecord){
      return res.status(400).json({message:"Invalid or expired OTP"})
    }
    const user = await User.findOneAndUpdate({email}, {isVerified:true});
    await OTP.deleteMany({email,action:"account_verification"});
    res.json({message:"Account Verified Successfully. You can now login.",
      _id:user._id,
      name:user.name,
      email:user.email,
      role:user.role,
      token:generatetoken(user._id,user.role)
    })
    
    
  } 

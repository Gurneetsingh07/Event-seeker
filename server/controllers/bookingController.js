const Booking = require("../models/Bookings.js");
const OTP = require("../models/OTP.js");
const Event = require("../models/Event.js");
const { sendOTPEmail, sendBookingEmail } = require("../utils/email.js");


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

exports.sendBookingOTP = async (req, res) => {
  const otp = generateOTP();
  await OTP.findOneAndDelete({
    email: req.user.email,
    action: "event_booking",
  });
  await OTP.create({
    email: req.user.email,
    otp: otp,
    action: "event_booking",
  });
  await sendOTPEmail(req.user.email, otp, "event booking");
  res.json({ success: true, message: "OTP sent successfully" });
};
exports.bookEvent = async (req, res) => {
  const { eventId, otp } = req.body;
  const otpRecord = await OTP.findOne({
    email: req.user.email,
    otp: otp,
    action: "event_booking",
  });
  if (!otpRecord) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
  if (!event.totalSeats <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "No seat available" });
  }
  const existingBooking = await Booking.findOne({
    event: eventId,
    user: req.user.id,
  });
  if (existingBooking) {
    return res
      .status(400)
      .json({ error: "you have already booked this event " });
  }
  const booking = await Booking.create({
    user: req.user.id,
    eventId,
    status: "pending",
    paymentStatus: "notpaid",
    amount: event.ticketPrice,
  });
  await OTP.deleteMany({ email: req.user.email, action: "event_booking" });
  await sendBookingEmail(req.user.email, req.user.username, event.title);
  res.status(201).json({
    message: "booking created. Please check your email for confirmation.",
  });
};

exports.confirmBooking = async (req, res) => {
  const paymentStatus = req.body.paymentStatus;
  if (!["paid", "notpaid"].includes(paymentStatus)) {
    return res.status(400).json({ error: "Invalid payment status" });
  }
  const booking = await Booking.findById(req.params.id).populate("eventId");
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.status === "confirmed") {
    return res.status(400).json({ error: "Booking is already confirmed" });
  }
  const event = await Event.findById(booking.eventId);
  if (event.totalSeats <= 0) {
    return res.status(400).json({ error: "no seats available" });
  }
  booking.status = "confirmed";
  if (paymentStatus) {
    booking.paymentStatus = paymentStatus;
  }
  await booking.save();
  event.totalSeats -= 1;
  await event.save();
  await sendBookingEmail(req.user.email, event.title, booking._id);
  res.json({ message: "booking confirmed" });
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate(
      "eventId",
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("eventId");
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.userId.toString() !== req.user.id.toString()) {
    return res
      .status(403)
      .json({ error: "Unauthorized to cancel this booking" });
  }
  booking.status = "cancelled";
  await booking.save();
  if (booking.status === "confirmed") {
    const event = await Event.findById(booking.eventId._id);
    event.totalSeats += 1;
    await event.save();
  }
  await booking.remove();
  res.json({ message: "Booking cancelled" });
};

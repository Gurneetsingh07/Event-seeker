const express = require("express");

const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const {
  bookEvent,
  getMyBookings,
  confirmBooking,
  cancelBooking,
  sendBookingOTP,
} = require("../controllers/bookingController");
router.post("/", protect, bookEvent);
router.get("/my", protect, getMyBookings);
router.put("/id/confirm", protect, admin, confirmBooking);
router.delete("/id", protect, cancelBooking);
router.post("/send-otp", protect, sendBookingOTP);
module.exports = router;

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const bookingRoutes = require("./routes/booking");
const { default: mongoose } = require("mongoose");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const dns = require("dns");
//routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

dns.setServers(["8.8.8.8", "1.1.1.1"]);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to mongodb database");
  })
  .catch((err) => {
    console.log("error connecting the mongodb", err);
  });
const Port = process.env.Port || 5000;
app.listen(Port, () => {
  console.log(`server is running on port ${Port}`);
});

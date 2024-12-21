const mongoose = require("mongoose");

const dbURI = process.env.DB; // Ensure this points to the updated database name
mongoose
  .connect(dbURI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

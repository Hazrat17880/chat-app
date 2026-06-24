import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // already connected
    if (mongoose.connections[0].readyState) {
      console.log("🟢 MongoDB already connected");
      return;
    }

    await mongoose.connect(process.env.MONGO_URL);

    console.log("🟢 MongoDB Connected Successfully");
  } catch (error) {
    console.error("🔴 MongoDB Connection Failed:", error.message);
    throw error; // important so server knows something went wrong
  }
};
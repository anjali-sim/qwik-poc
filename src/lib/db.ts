import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/qwik-chat";

declare global {
  var mongooseConn: typeof mongoose | undefined;
}

export async function connectDB() {
  if (globalThis.mongooseConn && mongoose.connection.readyState === 1) {
    return globalThis.mongooseConn;
  }
  await mongoose.connect(MONGODB_URI);
  globalThis.mongooseConn = mongoose;
  return mongoose;
}

// ─── User ───────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    avatar: { type: String, default: "" },
  },
  { timestamps: true },
);

// ─── Room ────────────────────────────────────────────────────────────────────
const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: String, required: true }, // username
    members: [{ type: String }], // array of usernames
  },
  { timestamps: true },
);

// ─── Message ─────────────────────────────────────────────────────────────────
const MessageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, default: "" },
    roomId: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Guard against re-compiling models in dev HMR
export const User =
  (mongoose.models.User as mongoose.Model<any>) ||
  mongoose.model("User", UserSchema);

export const Room =
  (mongoose.models.Room as mongoose.Model<any>) ||
  mongoose.model("Room", RoomSchema);

export const Message =
  (mongoose.models.Message as mongoose.Model<any>) ||
  mongoose.model("Message", MessageSchema);
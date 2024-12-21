const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define Reply Schema
const ReplySchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now },
});

// Define Thread Schema
const ThreadSchema = new Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  replies: [ReplySchema], // Array of ReplySchema
});

// Define Board Schema
const BoardSchema = new Schema({
  name: { type: String, required: true },
  threads: [ThreadSchema], // Array of ThreadSchema
}, { collection: 'boards' });  // Explicitly specify the collection name

// Create Models
const Reply = mongoose.model('Reply', ReplySchema);
const Thread = mongoose.model('Thread', ThreadSchema);
const Board = mongoose.model('Board', BoardSchema);

// Export Models
module.exports = {
  Reply,
  Thread,
  Board,
};

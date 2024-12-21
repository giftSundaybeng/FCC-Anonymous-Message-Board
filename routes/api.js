'use strict';
const BoardModel = require("../models").Board;
const ThreadModel = require("../models").Thread;
const ReplyModel = require("../models").Reply;

module.exports = function (app) {
  // Threads Route
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { board } = req.params;
        const { text, delete_password } = req.body;

        const newThread = new ThreadModel({
          board,
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        });

        const savedThread = await newThread.save();
        res.json(savedThread);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to save thread' });
      }
    })
    .get(async (req, res) => {
      try {
        const { board } = req.params;

        const threads = await ThreadModel.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .lean();

        threads.forEach(thread => {
          thread.replies = thread.replies.slice(-3);
          delete thread.delete_password;
          delete thread.reported;
          thread.replies.forEach(reply => {
            delete reply.delete_password;
            delete reply.reported;
          });
        });

        res.json(threads);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to fetch threads' });
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;

        const thread = await ThreadModel.findOneAndDelete({
          _id: thread_id,
          delete_password
        });

        if (!thread) {
          return res.status(400).send('incorrect password');
        }

        res.send('success');
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to delete thread' });
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;

        const updatedThread = await ThreadModel.findByIdAndUpdate(
          thread_id,
          { reported: true },
          { new: true }
        );

        if (!updatedThread) {
          return res.status(404).send('Thread not found');
        }

        res.send('reported');
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to report thread' });
      }
    });

  // Replies Route
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { board } = req.params;
        const { thread_id, text, delete_password } = req.body;

        const newReply = {
          _id: new ReplyModel()._id,
          text,
          delete_password,
          created_on: new Date(),
          reported: false
        };

        const updatedThread = await ThreadModel.findByIdAndUpdate(
          thread_id,
          {
            $push: { replies: newReply },
            $set: { bumped_on: new Date() }
          },
          { new: true }
        );

        if (!updatedThread) {
          return res.status(404).json({ error: 'Thread not found' });
        }

        res.json(updatedThread);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to save reply' });
      }
    })
    .get(async (req, res) => {
      try {
        const { board } = req.params;
        const { thread_id } = req.query;

        const thread = await ThreadModel.findOne({ _id: thread_id, board })
          .select('-delete_password -reported -replies.delete_password -replies.reported');

        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }

        res.json(thread);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to fetch replies' });
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;

        const thread = await ThreadModel.findById(thread_id);

        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }

        const reply = thread.replies.id(reply_id);

        if (!reply || reply.delete_password !== delete_password) {
          return res.status(400).send('incorrect password');
        }

        reply.text = '[deleted]';
        await thread.save();

        res.send('success');
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to delete reply' });
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;

        const thread = await ThreadModel.findById(thread_id);

        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }

        const reply = thread.replies.id(reply_id);

        if (!reply) {
          return res.status(404).json({ error: 'Reply not found' });
        }

        reply.reported = true;
        await thread.save();

        res.send('reported');
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to report reply' });
      }
    });

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': "frame-ancestors 'self';",
      'X-DNS-Prefetch-Control': 'off',
      'Referrer-Policy': 'same-origin',
    });
    next();
  });
};

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let thread_id;
  let reply_id;
  const board = 'test_board';
  const threadData = {
    text: 'Test thread',
    delete_password: 'delete123',
  };
  const replyData = {
    text: 'Test reply',
    delete_password: 'reply123',
  };

  suite('Threads', function () {
    test('Create a new thread: POST /api/threads/:board', function (done) {
      chai
        .request(server)
        .post(`/api/threads/${board}`)
        .send(threadData)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'board');
          assert.equal(res.body.text, threadData.text);
          thread_id = res.body._id; // Save thread ID for later use
          done();
        });
    });

    test('View recent threads: GET /api/threads/:board', function (done) {
      chai
        .request(server)
        .get(`/api/threads/${board}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          done();
        });
    });

    test('Report a thread: PUT /api/threads/:board', function (done) {
      chai
        .request(server)
        .put(`/api/threads/${board}`)
        .send({ thread_id })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Delete a thread with incorrect password: DELETE /api/threads/:board', function (done) {
      chai
        .request(server)
        .delete(`/api/threads/${board}`)
        .send({ thread_id, delete_password: 'wrongpassword' })
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Delete a thread with correct password: DELETE /api/threads/:board', function (done) {
      chai
        .request(server)
        .delete(`/api/threads/${board}`)
        .send({ thread_id, delete_password: threadData.delete_password })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });

  suite('Replies', function () {
    test('Create a new reply: POST /api/replies/:board', function (done) {
      // Create a new thread first for testing replies
      chai
        .request(server)
        .post(`/api/threads/${board}`)
        .send(threadData)
        .end((err, res) => {
          thread_id = res.body._id;

          chai
            .request(server)
            .post(`/api/replies/${board}`)
            .send({ thread_id, ...replyData })
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.property(res.body, '_id');
              assert.isArray(res.body.replies);
              reply_id = res.body.replies[res.body.replies.length - 1]._id; // Save reply ID
              done();
            });
        });
    });

    test('View replies on a thread: GET /api/replies/:board', function (done) {
      chai
        .request(server)
        .get(`/api/replies/${board}`)
        .query({ thread_id })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          done();
        });
    });

    test('Report a reply: PUT /api/replies/:board', function (done) {
      chai
        .request(server)
        .put(`/api/replies/${board}`)
        .send({ thread_id, reply_id })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Delete a reply with incorrect password: DELETE /api/replies/:board', function (done) {
      chai
        .request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id,
          reply_id,
          delete_password: 'wrongpassword',
        })
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Delete a reply with correct password: DELETE /api/replies/:board', function (done) {
      chai
        .request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id,
          reply_id,
          delete_password: replyData.delete_password,
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });
});

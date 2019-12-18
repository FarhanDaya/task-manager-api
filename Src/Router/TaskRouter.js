const mongoose = require("mongoose");
const express = require("express");
const Task = require("../Models/Task");
const auth = require("../Middleware/auth");

const router = new express.Router();

// to create task
router.post("/task", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });
  try {
    await task.save();

    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const part = req.query.sortBy.split(":");
    sort[part[0]] = part[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(_id)) {
    try {
      const task = await Task.findOne({ _id, owner: req.user._id });
      console.log(task);
      if (!task) {
        return res.status(404).send();
      }
      res.send(task);
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(404).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const params = Object.keys(req.body);
  const updates = ["description", "completed"];
  const allowedupdates = params.every(update => updates.includes(update));
  if (!allowedupdates) {
    return res.status(400).send({ error: "Invalid" });
  }
  const _id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(_id)) {
    try {
      const task = await Task.findOne({ _id, owner: req.user._id });

      if (!task) {
        return res.status(404).send();
      }
      params.forEach(update => (task[update] = req.body[update]));
      await task.save();
      res.send(task);
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(404).send();
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(_id)) {
    try {
      const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
      if (!task) {
        return res.status(404).send();
      }
      res.send(task);
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(404).send();
  }
});

module.exports = router;

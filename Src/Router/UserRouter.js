const express = require("express");
const User = require("../Models/User");
const auth = require("../Middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const router = new express.Router();

// to create user
router.post("/user", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generatejwt();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});
// find user by credentials
router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findbycredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generatejwt();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/users/profile", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/profile", auth, async (req, res) => {
  const params = Object.keys(req.body);
  const updates = ["name", "age", "password", "email"];
  const allowedupdates = params.every(update => updates.includes(update));
  if (!allowedupdates) {
    return res.status(400).send({ error: "Invalid" });
  }
  try {
    params.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/users/profile", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg,png)$/)) {
      return cb(new Error("please upload an Image"));
    }
    cb(undefined, true);
  }
});

router.post(
  "/users/profile/upload",
  auth,
  upload.single("upload"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.profile = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get(
  "/users/:id/upload",
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user || !user.profile) {
      throw new Error();
    }
    res.set("Content-Type", "image/png ");
    res.send(user.profile);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete(
  "/users/profile/upload",
  auth,
  async (req, res) => {
    req.user.profile = undefined;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

module.exports = router;

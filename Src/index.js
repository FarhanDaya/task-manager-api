const express = require("express");
require("./db/mongoose");
const Userrouter = require("./Router/UserRouter");
const Taskrouter = require("./Router/TaskRouter");
const app = express();

app.use(express.json());
app.use(Userrouter);
app.use(Taskrouter);

const port = process.env.PORT;

app.listen(port, () => {
  console.log("start at port :", port);
});

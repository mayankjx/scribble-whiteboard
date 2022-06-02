const express = require("express");

// initialising server
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 8080;

// middleware
app.use(express.static("./public"));

let userList = [];

io.on("connection", (socket) => {
  // game information
  let gameReady = false;
  let currentIndex = 0;

  function resetIndex() {
    if (currentIndex == userList.length - 1) {
      currentIndex = 0;
    }
  }

  //handle new connection
  console.log(`User connected: ` + socket.id);

  // handle new connection
  socket.on("new-connection", (data) => {
    let user = {};
    user["name"] = data;
    user["id"] = socket.id;
    userList.push(user);
    io.emit("new-user-connected", user);
    if (userList.length > 1) {
      gameReady = true;
    } else {
      gameReady = false;
    }
  });

  // handle start drawing event
  socket.on("start-drawing", (msg) => {
    socket.broadcast.emit("user-start-drawing", msg);
  });

  // handle drawing
  socket.on("draw-ongoing", (msg) => {
    socket.broadcast.emit("user-draw-ongoing", msg);
  });

  // handle drawing end
  socket.on("draw-end", () => {
    socket.broadcast.emit("user-end-draw", {});
  });

  // handle canvas clear
  socket.on("clear-canvas", () => {
    socket.broadcast.emit("user-clear-canvas", {});
  });

  // handle receiving message from client
  socket.on("chat message sender", (msg) => {
    // console.log(`message: ` + msg);
    io.emit("chat message receiver", msg);
  });

  // handle disconnect
  socket.on("disconnect", () => {
    // console.log(`User disconnected: ` + socket.id);
    let index = userList.findIndex((el) => el.id == `${socket.id}`);
    if (index > -1) {
      io.emit("user-disconnect");
      const name = userList[index].name;
      console.log(`Disconnecting ${name}`);
      userList.splice(index, 1);
    }
  });

  // setInterval(() => {
  //   if (gameReady) {
  //     // console.log(`Game can start now`);
  //     // emit to the particular socket
  //     let currentUserList = userList;
  //     io.to(currentUserList[currentIndex].id).emit("game-start", {});
  //     console.log(`${currentUserList[currentIndex].name} can start`);

  //     setTimeout(() => {
  //       console.log(`${currentUserList[currentIndex].name} can stop now`);
  //       currentIndex++;
  //       if (currentIndex == currentUserList.length) {
  //         currentIndex = 0;
  //       }
  //     }, 10000);
  //     // console.log(`${currentIndex}`);
  //   }
  // }, 10000);
});

app.get("/getUser", (req, res) => {
  res.status(200).send(userList);
});

// async start server
const start = async () => {
  try {
    http.listen(port, () => {
      console.log(`App is listening to port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

// start the server
start();

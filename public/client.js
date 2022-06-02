// DOM selection
const canvas = document.getElementById("drawBoard");
const clearCanvas = document.getElementById("clearCanvas");
const messageBar = document.getElementById("userText");
const messages = document.querySelector(".messages");
const submitUsername = document.querySelector(".connection");
const usernameField = document.getElementById("userInput");
const randomNumField = document.getElementById("randomInput");
const overlay = document.querySelector(".modal-overlay");
const modal = document.querySelector(".modal");
const connectionMsg = document.querySelector(".attention");
const playerList = document.querySelector(".playerList");

let socket = io();

// Canvas properties
const ctx = canvas.getContext("2d");

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

// Fitting canvas inside the parent div
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Variables
let isPainting = false;
let lineWidth = 5;
let startX;
let startY;
let username = usernameField.value;
let randomNumber = 0;
let canDraw = false;

// UserList function
const createUser = (userData) => {
  let div = document.createElement("div");
  div.className = "playerCard";
  div.innerHTML = `<p class="playerNum">1</p>
  <div class="playerInfo">
    <p class="playerName">${userData.name}</p>
    <p class="playerPoints">200</p>
  </div>
  <img src="./assets/user(1).png" alt="avatar" />`;
  playerList.appendChild(div);
};

const getUsers = async () => {
  const response = await fetch("/getUser");
  let data = await response.json();
  data.forEach((user) => {
    createUser(user);
  });
};

// on page load
function onPageLoad() {
  randomNumField.disabled = true;
  randomNumber = Math.floor(Math.random() * 10000) + 1000;
  randomNumField.value = randomNumber;
  getUsers();
}

// Username function
const setupConnection = () => {
  let number = randomNumber.toString();
  username = usernameField.value + "#" + number;

  // establishing connection
  socket.emit("new-connection", username);
  overlay.style.display = "none";
  modal.style.display = "none";
  connectionMsg.textContent = "You are connected!!";
};

// Canvas functions
const draw = (e) => {
  if (!isPainting) {
    return;
  }

  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  ctx.lineTo(e.clientX - canvasOffsetX, e.clientY - canvasOffsetY);
  ctx.stroke();
};

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ChatBox funtions
function sendMessage() {
  if (messageBar.value) {
    socket.emit("chat message sender", {
      user: `${username}`,
      message: `${messageBar.value}`,
    });
    messageBar.value = "";
  }
}

function createText(message) {
  let div = document.createElement("div");
  div.className = "text";
  div.innerHTML = `<h3>${message.user}</h3><p> ${message.message} </p>`;
  messages.appendChild(div);
}

// canvas drawing functions
const startDraw = (e) => {
  isPainting = true;
  startX = e.clientX;
  startY = e.clientY;
};

const endDraw = () => {
  isPainting = false;
  ctx.stroke();
  ctx.beginPath();
};

// EVENT LISTENERS
// canvas events

canvas.addEventListener("mousedown", (e) => {
  startDraw(e);
  msg = {
    clientX: e.clientX,
    clientY: e.clientY,
  };
  socket.emit("start-drawing", msg);
});

socket.on("user-start-drawing", (msg) => {
  startDraw(msg);
});

canvas.addEventListener("mouseup", (e) => {
  endDraw();
  socket.emit("draw-end", {});
});

socket.on("user-end-draw", () => {
  endDraw();
});

// message box event listner
messageBar.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// username event listener
submitUsername.addEventListener("click", setupConnection);

// calling event listeners
canvas.addEventListener("mousemove", (e) => {
  draw(e);
  msg = {
    clientX: e.clientX,
    clientY: e.clientY,
  };
  socket.emit("draw-ongoing", msg);
});

socket.on("user-draw-ongoing", (msg) => {
  draw(msg);
});

clearCanvas.addEventListener("click", () => {
  clear();
  socket.emit("clear-canvas", {});
});

socket.on("user-clear-canvas", () => {
  clear();
});

// Listening to incoming messages
socket.on("chat message receiver", function (msg) {
  createText(msg);
});

// Listening to new user connection
// Update user list when new user is connected
socket.on("new-user-connected", (user) => {
  playerList.innerHTML = "";
  getUsers();
});

// Listening to user diconnects
// update list when a user disconnects
socket.on("user-disconnect", () => {
  playerList.innerHTML = "";
  getUsers();
});

socket.on("turn-confirm", () => {
  console.log(`Its my turn`);
});

socket.on("turn-dismiss", () => {
  console.log(`My turn over`);
});

onPageLoad();

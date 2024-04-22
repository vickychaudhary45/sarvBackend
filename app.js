const express = require("express");
// const homeRoutes = require('./src/routes/homePage')
const logger = require("morgan");
const inventriesRouts = require("./src/routes/inventry");
const holidayRouts = require("./src/routes/holidays");
const actRouts = require("./src/routes/act");
const pilgriRouts = require("./src/routes/pilgri");
const connectDB = require("./src/config/dbConfig");
const activityRouts = require("./src/routes/activity");
const advantureRouts = require("./src/routes/advanture");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const processRouts = require("./src/routes/process");
const experienceRoute = require("./src/routes/experience");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");
// const crypto = require('crypto');

// const secretKey = crypto.randomBytes(32).toString('hex');
const secretKey = process.env.SECRET_KEY;
connectDB();
const app = express();
// app.use(bodyParser.json());
app.use(express.json({ limit: "50mb" }));

app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  console.log(req.url);
  console.log(req.headers);
  console.log(req.body, "asas");
  // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  // res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  // res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://v1.sarvatrah.com",
    ],
    credentials: true,
    exposedHeaders: "*",
    optionsSuccessStatus: 200,
    preflightContinue: false,
    allowedHeaders: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  })
);

app.use(cookieParser());
app.use(logger("dev"));

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5173");
//   // res.header('Access-Control-Allow-Origin','https://v1.sarvatrah.com');
//   res.header("Access-Control-Allow-Origin", "http://127.0.0.1:3000");

//   res.header("X-Powered-By", "Sarvatrah Server");
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header(
//     "Access-Control-Allow-Header",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   if (req.method === "OPTIONS") {
//     res.header("Acess-Control-Allow-Methods", "GET, POST, DELETE, PATCH");
//     res.status(200).json({});
//   }
//   next();
// });

app.use(express.static("public"));

// app.use('/home',homeRoutes)

app.use("/inventries", inventriesRouts);

app.use("/holidays", holidayRouts);
app.use("/activity", actRouts);
app.use("/pilgri", pilgriRouts);
app.use("/activities", activityRouts);
app.use("/advanture", advantureRouts);
app.use("/process", processRouts);
app.use("/experience", experienceRoute);

app.post("/token/:type", (req, res) => {
  if (req.params.type === "room") {
    jwt.sign(req.body, secretKey, (err, token) => {
      if (err) {
        res.status(500).json({ error: "Failed to generate token" });
      } else {
        res.setHeader(
          "Set-Cookie",
          cookie.serialize("roomInfo", token, {
            expires: new Date(Date.now() + 3600 * 1000), // 1 hour
            path: "/",
          })
        );
        res.status(200).json({ token: token });
      }
    });
  } else if (req.params.type === "activity") {
    jwt.sign(req.body, secretKey, (err, token) => {
      if (err) {
        res.status(500).json({ error: "Failed to generate token" });
      } else {
        res.setHeader(
          "Set-Cookie",
          cookie.serialize("itineraryData", token, {
            expires: new Date(Date.now() + 3600 * 1000),
            path: "/", // 1 hour
          })
        );
        res.status(200).json({ token: token });
      }
    });
  }
});

app.use((req, res, next) => {
  const erro = Error("Not Found 404");
  erro.status = 404;
  next(erro);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ message: { error: error.message } });
});

module.exports = app;

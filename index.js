require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const HoldingsModel = require("./models/HoldingsModel.js");
const { PositionsModel } = require("./models/PositionsModel.js");
const { OrdersModel } = require("./models/OrdersModel.js");
const cookieParser = require("cookie-parser");
const AuthRoute = require("./AuthRoute.js");

const Port = process.env.PORT || 3004;
const url = process.env.MONGO_URL;
const app = express();
const cors = require("cors");
const predictRoute = require("./routes/predictStock");



app.use(cors({
  origin: "*",  // ✅ Allows requests from ALL origins
  credentials: true
}));


app.use(bodyParser.json());
app.use("/api", predictRoute);


// app.get("/addHoldings", async (req, res) => {
//   let  allOrders =  [
//     {
//       name: "INFY",
//       price: 1555.45,
//       percent: "-1.60%",
//       isDown: true,
//     },
//     {
//       name: "ONGC",
//       price: 116.8,
//       percent: "-0.09%",
//       isDown: true,
//     },
//     {
//       name: "TCS",
//       price: 3194.8,
//       percent: "-0.25%",
//       isDown: true,
//     },
//     {
//       name: "KPITTECH",
//       price: 266.45,
//       percent: "3.54%",
//       isDown: false,
//     },
//     {
//       name: "QUICKHEAL",
//       price: 308.55,
//       percent: "-0.15%",
//       isDown: true,
//     },
//     {
//       name: "WIPRO",
//       price: 577.75,
//       percent: "0.32%",
//       isDown: false,
//     },
//     {
//       name: "M&M",
//       price: 779.8,
//       percent: "-0.01%",
//       isDown: true,
//     },
//     {
//       name: "RELIANCE",
//       price: 2112.4,
//       percent: "1.44%",
//       isDown: false,
//     },
//     {
//       name: "HUL",
//       price: 512.4,
//       percent: "1.04%",
//       isDown: false,
//     },
//   ];
//   allOrders.forEach((data) => {
//     let newOrder = new OrdersModel({
//     name: data.name,
//     price: data.price,
//     percent: data.percent,
//     isDown: data.isDown,
//     });

//     newOrder.save();
//     console.log("data saved");
//   });

//   res.send("aDone");
// });

app.use(cookieParser());

app.use(express.json());

app.use("/", AuthRoute);

app.get("/allHoldings", async(req, res)=>{
  const allHoldings = await HoldingsModel.find();
  res.send(allHoldings);
})

app.get("/allPositions", async(req, res)=>{
  const allPositions = await PositionsModel.find();
  res.send(allPositions);
})

app.post("/addNewOrder", async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;

    console.log("📦 New order received:", req.body);

    if (!name || !qty || !price || !mode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newOrder = new OrdersModel({ name, qty, price, mode });
    await newOrder.save();

    console.log("✅ Order saved successfully:", newOrder);

    // ✅ Always respond with JSON
    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      newOrder,
    });
  } catch (error) {
    console.error("❌ Error saving order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
});



app.get("/allOrders", async(req, res) =>{
  const allOrders = await OrdersModel.find({});
  res.send(allOrders);
})

app.listen(Port, () => {
  console.log("Server started at port", Port);
});


// ✅ Get all orders
app.get("/allOrders", async (req, res) => {
  try {
    const allOrders = await OrdersModel.find({});
    res.status(200).json(allOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});


mongoose.connect(url)
  .then(() => {
    console.log("db connected successfully");
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
  })



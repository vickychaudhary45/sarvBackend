const express = require("express");
const {
  vehicleCollection,
  hotelCollection,
  Category,
} = require("../models/inventries");
// const multer = require('multer')
const upload = require("../utils/file_upload/upload");
const jwt = require("jsonwebtoken");

const route = express.Router();
const { v4: uuidv4 } = require("uuid");
const imgID = uuidv4();
route.get("/", (req, res, next) => {
  res.status(200).json({
    message: "iventries homepage",
  });
});

route.post("/vehicle", upload.single("file"), async (req, res, next) => {
  console.log(vehicleCollection);
  const vehicleType = req.query.vehicleType;
  const brandName = req.query.brandName || false;
  const modelName = req.query.modelName || false;
  const inventry = req.query.inventry || false;
  const seatLimit = req.query.seatLimit || false;
  const luggageCapacity = req.query.luggageCapacity || false;
  const active = req.query.active;
  const facilties = req.query.facilties;
  const vehicleCategory = req.query.vehicleCategory;
  const city = req.query.city;
  // console.log(req.file.mimetype)
  // const blackout = JSON.parse(req.query.blackout)
  const addVehicle = await vehicleCollection.create({
    vehicleType: vehicleType,
    brandName: brandName,
    modelName: modelName,
    inventry: inventry,
    seatLimit: seatLimit,
    luggageCapacity: luggageCapacity,
    active: active,
    city: city,
    facilties: facilties,
    vehicleCategory: vehicleCategory,
    // img:{filename:req.file.filename,path:'http://127.0.0.1:3232/'+req.file.path.replace('public/',''),mimetype:req.file.mimetype}
  });
  res.status(200).json({
    data: [vehicleType, brandName, modelName, inventry, seatLimit, active],
  });
});

route.post("/categories", async (req, res) => {
  try {
    const { categoryType, name } = req.query;
    console.log("categoryType, name", { categoryType, name });
    const newCategory = new Category({ category: categoryType, name });
    await newCategory.save();
    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ success: false, message: "Failed to add category" });
  }
});

route.get("/vehicle", async (req, res, next) => {
  const vehicleType = req.query.vehicleType || false;
  const brandName = req.query.brandName || false;
  const modelName = req.query.modelName || false;
  if (!vehicleType && !brandName) {
    console.log(vehicleCollection);
    const getVehicleType = await vehicleCollection.distinct("vehicleType");
    return res.status(200).json({ data: getVehicleType });
  } else if (vehicleType) {
    const getBrandName = await vehicleCollection.find({
      vehicleType: vehicleType,
    });
    return res.status(200).json({ data: getBrandName });
  } else if (brandName) {
    const getModelName = await vehicleCollection.find({ brandName: brandName });
    return res.status(200).json({ data: getModelName });
  }
});

route.post("/hotel", upload.array("file"), async (req, res, next) => {
  const getRoomInfo = req.cookies.roomInfo;
  // const decryptRoomInfo = jwt.verify(getRoomInfo, process.env.SECRET_KEY)
  const decryptRoomInfo = JSON.parse(getRoomInfo);
  const rooms = decryptRoomInfo;
  const hotelType = req.query.hotelType;
  const hotelName = req.query.hotelName;
  const address = req.query.address;
  const state = req.query.state;
  const city = req.query.city;
  const pincode = req.query.pincode;
  const phoneNumber = req.query.phoneNumber;
  const email = req.query.email;
  const contactPerson = req.query.contactPerson;
  const description = req.query.description;
  const imgs = req.files.map((file) => {
    return {
      filename: file.filename,
      path: "http://127.0.0.1:3232/" + file.path.replace("public/", ""),
      mimetype: file.mimetype,
    };
  });
  await hotelCollection.create({
    hotelType: hotelType,
    hotelName: hotelName,
    address: address,
    state: state,
    city: city,
    pincode: pincode,
    phoneNumber: phoneNumber,
    email: email,
    contactPerson: contactPerson,
    description: description,
    imgs: imgs,
    rooms: rooms.roomInfo,
  });
  return res.status(200).json({ Status: "Hotel uploaded" });
});
module.exports = route;

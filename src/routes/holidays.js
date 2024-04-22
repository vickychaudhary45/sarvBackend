const express = require("express");
const packageCollection = require("../models/holidaysPackage");
const upload = require("../utils/file_upload/upload");
const route = express.Router();
const jwt = require("jsonwebtoken");
const { vehicleCollection, hotelCollection } = require("../models/inventries");

route.get("/", async (req, res, next) => {
  console.log(req.cookies);
  res.status(200).json({
    message: "holiday package homepage",
  });
});

route.get("/packages", async (req, res, next) => {
  const packageList = await packageCollection.find({ active: true });
  // Get Icon
  const getIcons = (args) => {
    const activity_lists = [];
    const activity_obj = { car: 1, hotel: 0, activity: 0 };
    for (let obj of args) {
      console.log("----------------------");
      for (let activity of obj.activities) {
        if (activity.objType === "hotel") {
          activity_obj.hotel = activity_obj.hotel + 1;
        } else if (activity.objType === "activity") {
          activity_obj.activity = activity_obj.activity + 1;
        }
      }
    }
    return activity_obj;
  };

  const filterList = packageList.map((data) => {
    getIcons(data.itinerary);
    return {
      duration: data.packageDuration,
      image: data.themeImg.path,
      packageName: data.packageName,
      startPlace: data.itinerary.map((iti) => iti.place),
      uses: getIcons(data.itinerary),
      id: data._id,
      price: data.price,
    };
  });

  res.status(200).json(filterList);
});

route.get("/package/gallery/:id", async (req, res, next) => {
  const packageID = req.params.id;
  const packageInfo = await packageCollection.findById(packageID);

  console.log(packageInfo.imgs);
  res.status(200).json({ message: "working" });
});
route.get("/package/details/:id", async (req, res, next) => {
  const packageID = req.params.id;
  let sortedCar;
  const carList = [];
  if (!req.cookies.room_guest) {
    let guestLists = { adult: 2, cb: 0, cwb: 0 };
  }

  const packageInfo = await packageCollection.findById(packageID);
  const response = {
    packageDuration: packageInfo.packageDuration,
    _id: packageInfo._id,
    packageName: packageInfo.packageName,
    roomLimit: packageInfo.roomLimit,
    include: packageInfo.include,
    itinerary: packageInfo.itinerary,
    exclude: packageInfo.exclude,
    price: packageInfo.price,
  };

  res.status(200).json(response);
});

route.get("/package/iti/:id", async (req, res, next) => {
  const packageID = req.params.id;
  let sortedCar;
  const packageInfo = await packageCollection.findById(packageID);
  const carList = [];
  let guestLists;
  if (!req.cookies.room_guest) {
    guestLists = [{ adult: 2, cb: 0, cwb: 0 }];
  } else {
    guestLists = JSON.parse(req.cookies.room_guest);
    console.log(guestLists);
  }
  const guests = guestLists.reduce(
    (acc, current) => {
      acc.adult += current.adult;
      acc.adult += current.cb;
      acc.adult += current.cwb;
      return acc;
    },
    { adult: 0 }
  );
  for (let car of packageInfo.availableVehicle) {
    const carAvailable = await vehicleCollection.find({
      seatLimit: car.seatLimit,
      vehicleType: car.vehicleType,
      vehicleCategory: car.vehicleCategory,
      city: "Cochin",
    });
    if (carAvailable[0].inventry > 0) {
      const calcSeat = guests.adult / parseInt(car.seatLimit);
      const newCarObj = {
        vehicleCategory: car.vehicleCategory,
        activityID: carAvailable[0]._id,
        vehicleType: car.vehicleType,
        price: car.price,
        seatLimit: car.seatLimit,
        quantity: Math.ceil(calcSeat),
        totalPrice: parseInt(car.price) * Math.ceil(calcSeat),
      };
      carList.push(newCarObj);
    } else {
      continue;
    }
  }
  sortedCar = [
    ...carList.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 3),
    ...carList.sort((a, b) => b.totalPrice - a.totalPrice).slice(0, 1),
  ];
  sortedCar = sortedCar.sort((a, b) => a.quantity - b.quantity).slice(0, 4);

  const result = {
    itinerary: await Promise.all(
      packageInfo.itinerary.map(async (data) => {
        return {
          title: data.title,
          dayCount: data.dayCount,
          place: data.place,
          activities: await Promise.all(
            data.activities.map(async (act) => {
              if (act.objType === "car") {
                let carResult = {
                  ...sortedCar[0],
                  ...{ sequence: act.sequence, objType: act.objType },
                };
                return carResult;
              } else if (act.objType === "hotel") {
                const hotelAvailable = await hotelCollection.find({
                  city: data.place,
                });
                // console.log('hotels',hotelAvailable)

                const hotelList = hotelAvailable.sort(
                  (a, b) => a.rooms[0].occupancy1 - b.rooms[0].occupancy1
                );
                return {
                  sequence: act.sequence,
                  objType: act.objType,
                  activityID: hotelList[0]._id,
                };
              } else {
                return act;
              }
            })
          ),
        };
      })
    ),
  };
  res.status(200).json(result);
});

route.get("/package/iti/vehicle/update/:id", async (req, res, next) => {
  const packageID = req.params.id;
  let sortedCar;
  const packageInfo = await packageCollection.findById(packageID);
  const carList = [];
  let guestLists;
  if (!req.cookies.room_guest) {
    guestLists = [{ adult: 2, cb: 0, cwb: 0 }];
  } else {
    guestLists = JSON.parse(req.cookies.room_guest);
    console.log(guestLists);
  }
  const guests = guestLists.reduce(
    (acc, current) => {
      acc.adult += current.adult;
      acc.adult += current.cb;
      acc.adult += current.cwb;
      return acc;
    },
    { adult: 0 }
  );

  for (let car of packageInfo.availableVehicle) {
    const carAvailable = await vehicleCollection.find({
      seatLimit: car.seatLimit,
      vehicleType: car.vehicleType,
      vehicleCategory: car.vehicleCategory,
      city: "Cochin",
    });
    if (carAvailable[0].inventry > 0) {
      const calcSeat = guests.adult / parseInt(car.seatLimit);
      console.log(car);
      const newCarObj = {
        vehicleCategory: car.vehicleCategory,
        activityID: carAvailable[0]._id,
        vehicleType: car.vehicleType,
        price: car.price,
        seatLimit: car.seatLimit,
        quantity: Math.ceil(calcSeat),
        totalPrice: parseInt(car.price) * Math.ceil(calcSeat),
        // img: carAvailable[0].img.path
      };
      carList.push(newCarObj);
    } else {
      continue;
    }
  }
  sortedCar = [
    ...carList.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 3),
    ...carList.sort((a, b) => b.totalPrice - a.totalPrice).slice(0, 1),
  ];
  sortedCar = sortedCar.sort((a, b) => a.quantity - b.quantity).slice(0, 4);

  res.status(200).json(sortedCar);
});

route.get("/package/iti/hotel/update/:id", async (req, res, next) => {
  const packageID = req.params.id;
  const packageInfo = await packageCollection.findById(packageID);
  let guestLists;
  if (!req.cookies.room_guest) {
    guestLists = [{ adult: 2, cb: 0, cwb: 0 }];
  } else {
    guestLists = JSON.parse(req.cookies.room_guest);
  }

  let hotelList;
  let hotelResult = new Array();

  for (let data of packageInfo.itinerary) {
    for (let act of data.activities) {
      if (act.objType === "hotel") {
        const hotelAvailable = await hotelCollection.find({ city: "Cochin" });
        hotelList = hotelAvailable.sort(
          (a, b) => a.rooms[0].occupancy1 - b.rooms[0].occupancy1
        );
      }
    }
  }
  for (let hotel of hotelList) {
    let bashPrice;
    hotelResult.push({
      hotelName: hotel.hotelName,
      img: hotel.imgs[0].path,
      activityID: hotel._id,
      rooms: hotel.rooms.map((vac) => {
        if (vac.roomType === "Standard") {
          bashPrice = vac.occupancy2;
        }
        let travellerPrice = 0;
        for (let traveller of guestLists) {
          if (traveller.adult === 1) {
            travellerPrice = travellerPrice + vac.occupancy1;
          }
          if (traveller.adult === 2) {
            travellerPrice = travellerPrice + vac.occupancy2;
          }
          if (traveller.adult === 3) {
            travellerPrice = travellerPrice + vac.occupancy3;
          }
          if (traveller.cb) {
            travellerPrice =
              travellerPrice + vac.child.childWithBedPrice * traveller.cb;
          }
          if (traveller.cwb) {
            travellerPrice =
              travellerPrice + vac.child.childWithoutBedPrice * traveller.cwb;
          }
          console.log(traveller);
        }
        console.log(travellerPrice);

        return {
          roomType: vac.roomType,
          totalPrice: travellerPrice,
          payable: travellerPrice - bashPrice,
        };
      }),
    });
    console.log("-------------------");
  }
  //     const result = await Promise.all( packageInfo.itinerary.map(async(data) =>{
  //         return  (
  //             await Promise.all(data.activities.map( async(act)=>{

  //             if (act.objType ==="hotel"){
  //                 const hotelAvailable = await hotelCollection.find({city:'Cochin'})

  //                 const hotelList = hotelAvailable.sort((a,b) =>a.rooms[0].occupancy1-b.rooms[0].occupancy1)
  //                 return (
  //                     {
  //                         hotels:hotelList.slice(0,4)
  //                     }
  //                 )
  //             }
  //             else{

  //             }

  //         }))
  //     )}),
  //   )
  res.status(200).json(hotelResult);
});
// route.get('/package/iti/:id', async (req,res,next) =>{
//     const packageID = req.params.id
//     const packageInfo = await packageCollection.findById(packageID);

//     if (!req.cookies.wr){
//         const guests = {adult:2,cb:0,cwb:0}
//         const carList = []
//         var sortedCar =[]
//         for (let car of packageInfo.availableVehicle){

//                 const getCar = guests.adult/parseInt(car.seatLimit)
//                 const newCarObj = {
//                     vehicleCategory: car.vehicleCategory,
//                     vehicleId: car._id,
//                     vehicleType:car.vehicleType,
//                     price: car.price,
//                     seatLimit: car.seatLimit,
//                     quantity: Math.ceil(getCar),
//                     totalPrice: parseInt(car.price) * Math.ceil(getCar)
//                 }
//                 carList.push(newCarObj);

//         }

//         sortedCar = [...carList.sort((a,b) =>a.totalPrice-b.totalPrice).slice(0,3) ,
//         ...carList.sort((a,b) =>b.totalPrice-a.totalPrice).slice(0,1)]
//         // console.log(sortedCar)
//     }
//     else{
//         console.log(req.cookies.wor)

//     }

//     const result = {itinerary:packageInfo.itinerary.map( (data) =>{
//         return (
//         {title:data.title,
//         dayCount: data.dayCount,
//         place:data.place,
//         activities: data.activities.map( (act)=>{
//             if (act.objType ==="car"){
//                 return (
//                     {sequence:act.sequence,
//                         activityID:sortedCar,
//                         objType: act.objType
//                     }
//         )
//             }
//             else if (act.objType ==="hotel"){
//                 return (
//                     {sequence:act.sequence,
//                         objType: act.objType
//                     }
//                 )
//             }
//         })}
//     )}),
//                     }

//     res.status(200).json(result)

// })

route.post(
  "/package",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "subfile", maxCount: 10 },
  ]),
  async (req, res, next) => {
    const packageName = req.query.packageName;
    const packageDuration = JSON.parse(req.query.packageDuration);
    const availableVehicle = JSON.parse(req.query.availableVehicle);
    const roomLimit = req.query.roomLimit;
    const include = req.query.include;
    const exclude = req.query.exclude;
    const price = req.query.price;
    const themeImg = {
      filename: req.files.file[0].filename,
      path:
        "http://127.0.0.1:3232/" +
        req.files.file[0].path.replace("public/", ""),
      mimetype: req.files.file[0].mimetype,
    };
    // const imgs = req.files.subfile.map(file =>{
    //     return {filename:file.filename,path:'http://127.0.0.1:3232/'+file.path.replace('public/',''),mimetype:file.mimetype}
    // })
    await packageCollection.create({
      packageName: packageName,
      packageDuration: packageDuration,
      availableVehicle: availableVehicle,
      roomLimit: roomLimit,
      include: include,
      exclude: exclude,
      themeImg: themeImg,
      // imgs:imgs,
      price: price,
    });
    return res.status(200).json({ Status: "Package Created" });
  }
);

route.post("/package/itinerary", async (req, res, next) => {
  const dayCount = req.query.dayCount;
  const packageID = req.query.packageID;
  const place = req.query.place;
  const include = req.query.include;
  const exclude = req.query.exclude;
  const title = req.query.title;
  const itineraryInfo = req.cookies.itineraryData;

  // const decryptActivityInfo = jwt.verify(itineraryInfo,process.env.SECRET_KEY)
  const decryptActivityInfo = JSON.parse(itineraryInfo);
  const addItinerary = {
    dayCount: dayCount,
    place: place,
    include: include,
    exclude: exclude,
    title: title,
    activities: decryptActivityInfo.activities,
  };
  const packageInfo = await packageCollection.findById(packageID);
  if (!packageInfo) {
    return res.status(404).json({ error: "Package not found" });
  }
  packageInfo.itinerary.push(addItinerary);
  const updatedPackageInfo = await packageInfo.save();
  res.status(200).json(updatedPackageInfo);
});

module.exports = route;

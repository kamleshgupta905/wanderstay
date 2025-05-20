const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require('./models/listing');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const {listingSchema} = require("./schema")
// const { data } = require('./data');


const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));


main().then(() => {
    console.log("connected to DB");
}).catch(err => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.get("/", (req,res) => {
    res.send("Hi, I am root");
});

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el)=> el.message).join(",")
        throw new ExpressError(400, errMsg)
    } else {
        next();
    }
}

//index route
app.get("/listings", wrapAsync( async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
}));

//New route
app.get("/listings/new", (req, res) => {
    
    res.render("listings/new");
});

//Show route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show", { listing });
}));

//Create route
app.post("/listings",
    validateListing,
    wrapAsync(async (req, res, next) => {
        
        let { title, description, image, price, country, location } = req.body;
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

//Edit route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", { listing });
}));

//Update route
app.put("/listings/:id",
    validateListing,
    wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
}));

//Delete route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect(`/listings`);
}));


// const { data } = require('./data'); // Import the sample data

// // Seed the database with the data from 'data.js'
// app.get('/seed', async (req, res) => {
//     try {
//         // Clear existing listings
//         await Listing.deleteMany({});

//         // Insert sample listings into the database
//         await Listing.insertMany(data);

//         res.send("Database seeded with sample data!");
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Error seeding database.");
//     }
// });

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
})

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", {message});
    // res.status(statusCode).send(message);
})

app.listen(8087, () => {
    console.log("server is listening to port 8087");
});

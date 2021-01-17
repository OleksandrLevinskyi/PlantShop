/*
    Author: Oleksandr Levinskyi;
    Date: 04/10/2020;
*/

// import dependencies
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
// set up express validator
const { check, validationResult } = require('express-validator');
// set up the DB connection
const mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/plantshop',{
    useNewUrlParser:true,
    useUnifiedTopology:true
});

// set up the model for the order
const Order=mongoose.model('Order',{
    name: String,
    email: String,
    phone: String,
    deliveryAddress: String,
    potSmall: Number,
    potMedium: Number,
    potBig: Number,
    shippingCharge: Number,
    subTotal: Number,
    tax: Number,
    taxPayed: Number,
    total: Number
});

// global variable set up
var plantShop = express();

// set paths to the public and views folders
plantShop.set('views', path.join(__dirname, 'views'));
plantShop.use(express.static(__dirname + '/public'));
plantShop.use(bodyParser.urlencoded({ extended: false }));

// defining the view engine to be used
plantShop.set('view engine', 'ejs');

// -------------------------- validations --------------------------
// ------------ regular expressions ------------
// regex for a phone number: 111-111-1111 or 1111111111 (10 digits)
var phoneRegex = /^([0-9]{3}-?){2}[0-9]{4}$/;
// regex for a Canadian postal code: A2A 2A2 or A2A2A2
var postcodeRegex = /^[A-Z][0-9][A-Z][\s]?[0-9][A-Z][0-9]$/;
// regex for a whole number
var wholeNumberRegex=/^[0-9]+$/;
// regex for a positive integer
var positiveIntegerRegex = /^[1-9][0-9]*$/;
// regex for a province code
var provinceCodeRegex=/^[A-Z]{2}$/;

// ------------ regex validation function ------------
function regexCheck(input, regex) {
    if (!regex.test(input))
        return false;
    else
        return true;
}

// ------------ custom validation functions ------------
// phone number validation
function customPhoneValidation(value) {
    if (!regexCheck(value, phoneRegex)) {
        throw new Error('Phone must be formatted as xxx-xxx-xxxx');
    }
    return true;
}
// postal code validation
function customPostalCodeValidation(value) {
    if (!regexCheck(value, postcodeRegex)) {
        throw new Error('Postal Code must be formatted as A2A 2A2');
    }
    return true;
}
// province code validation (to avoid any SQL injections in the DB)
function customProvinceCodeValidation(value){
    if(!regexCheck(value,provinceCodeRegex)){
        throw new Error('Province is required');
    }
    return true;
}
/* 
    quantity of purchased goods validation
        1. the entered value in the product input boxes should be a number
        2. at least one product should be bought
*/
function customItemsPurchasedValidation(value, { req }) {
    var potSmall = stringToZero(value);
    var potMedium = stringToZero(req.body.potMedium);
    var potBig = stringToZero(req.body.potBig);
    if (!regexCheck(potSmall, wholeNumberRegex) || !regexCheck(potMedium, wholeNumberRegex) || !regexCheck(potBig, wholeNumberRegex)) {
        throw new Error('Pots purchased can be positive integers only');
    }
    else {
        potSmall = parseInt(potSmall);
        potMedium = parseInt(potMedium);
        potBig = parseInt(potBig);
        if ((potSmall + potMedium + potBig) == 0) {
            throw new Error('At least one pot must be purchased');
        }
    }
    return true;
}
// check the delivery time value using regex (to avoid any SQL injections in the DB)
function customDeliveryTimeValidation(value) {
    if (!regexCheck(value, positiveIntegerRegex)) {
        throw new Error('Delivery Time must be a number');
    }
    return true;
}
// if string is empty or null, make it zero
// else return the trimmed string
function stringToZero(text){
    text=(text+"").trim();
    if(text==""){
        text=0;
    }
    return text;
}



// home page route
plantShop.get('/', function (req, res) {
    res.render('index');
});

plantShop.post('/', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Email is required').notEmpty(),
    check('phone').custom(customPhoneValidation),
    check('address', 'Address is required').notEmpty(),
    check('city', 'City is required').notEmpty(),
    check('postcode').custom(customPostalCodeValidation),
    check('province').custom(customProvinceCodeValidation),
    check('potSmall').custom(customItemsPurchasedValidation),
    check('deliveryTime').custom(customDeliveryTimeValidation)
], function (req, res) {
    const errors = validationResult(req);
    // if errors are not empty, pass them to the form page (index.ejs)
    if (!errors.isEmpty()) {
        res.render('index', {
            errors: errors.array()
        });
    }
    else {
        var tax, taxPayed, subTotal, total;
        var shippingCharge = 0;

        // fetch the input from the form
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var address = req.body.address;
        var city = req.body.city;
        var postcode = req.body.postcode;
        var province = req.body.province;
        var potSmall = req.body.potSmall;
        var potMedium = req.body.potMedium;
        var potBig = req.body.potBig;
        var deliveryTime = req.body.deliveryTime;

        if (potSmall == null || potSmall.trim() == "") { potSmall = 0; }
        if (potMedium == null || potMedium == "") { potMedium = 0; }
        if (potBig == null || potBig == "") { potBig = 0; }

        // provincial taxes
        if (province == "AB" || province == "NT" || province == "NU" || province == "YT") {
            tax = 5;
        }
        else if (province == "BC" || province == "MB") {
            tax = 12;
        }
        else if (province == "NB" || province == "NL" || province == "NS" || province == "PE") {
            tax = 15;
        }
        else if (province == "ON") {
            tax = 13;
        }
        else if (province == "QC") {
            tax = 14.975;
        }
        else if (province == "SK") {
            tax = 11;
        }

        // shipping charges
        if (deliveryTime == 1) {
            shippingCharge = 30;
        }
        else if (deliveryTime == 2) {
            shippingCharge = 25;
        }
        else if (deliveryTime == 3) {
            shippingCharge = 20;
        }
        else if (deliveryTime == 4) {
            shippingCharge = 15;
        }

        subTotal = (potSmall * 10) + (potMedium * 20) + (potBig * 30) + shippingCharge;
        taxPayed = (subTotal * (tax / 100)).toFixed(2);
        total = (subTotal * 1 + taxPayed * 1).toFixed(2);

        var receipt = {
            name: name,
            email: email,
            phone: phone,
            deliveryAddress: (address + ", " + city + ", " + province + ", " + postcode),
            potSmall: potSmall,
            potMedium: potMedium,
            potBig: potBig,
            shippingCharge: shippingCharge,
            subTotal: subTotal,
            tax: tax,
            taxPayed: taxPayed,
            total: total
        }

        // make up the order from a model for the DB
        var newOrder=new Order(receipt);
        // save the order to the DB
        newOrder.save().then(function(){
            console.log('New order added successfully');
        });
        // send receipt data to the form
        res.render('index', receipt);
    }
});

// all orders page route
plantShop.get('/allorders',function(req,res){
    Order.find({}).exec(function(err,orders){
        if(err!=null){
            console.log(err);
        }
        res.render('allorders',{orders:orders});
    });
});



// start the server and listen at a port (8080)
plantShop.listen(8080);

// confirmation message
console.log('Plant Shop launched at port 8080 successfully (Assignment 4 | Oleksandr Levinskyi)');
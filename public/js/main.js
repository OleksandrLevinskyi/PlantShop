/*
    Author: Oleksandr Levinskyi;
    Date: 04/06/2020;
*/

var errors = '';
var tax, taxPayed, subTotal, total;
var shippingCharge = 0;
var phoneRegex = /^([\d]{3}-){2}[\d]{4}$/;
var postcodeRegex = /^[A-Z][\d][A-Z]\s[\d][A-Z][\d]$/;
var emptyRegex = /^(.+)$/;
var positiveIntegerRegex = /^[\d]*$/;
function OnSubmit() {
    return true;
    errors = '';
    document.getElementById('receiptDisplay').innerHTML = 'Enter valid data to view your receipt.';
    document.getElementById('errors').innerHTML = errors;

    var name = document.getElementById('name').value;
    var email = document.getElementById('email').value;
    var phone = document.getElementById('phone').value;
    var address = document.getElementById('address').value;
    var city = document.getElementById('city').value;
    var postcode = document.getElementById('postcode').value;
    postcode = postcode.toUpperCase();
    document.getElementById('postcode').value = postcode;
    var province = document.getElementById('province').value;

    var potSmall = document.getElementById('potSmall').value;
    var potMedium = document.getElementById('potMedium').value;
    var potBig = document.getElementById('potBig').value;

    var deliveryTime = document.getElementById('deliveryTime').value;


    // validations
    ValidateRegex(emptyRegex, name, "Name is required.");
    ValidateRegex(emptyRegex, email, "Email is required.");
    ValidateRegex(phoneRegex, phone, "Phone is required. Check the format.");
    ValidateRegex(emptyRegex, address, "Address is required.");
    ValidateRegex(emptyRegex, city, "City is required.");
    ValidateRegex(postcodeRegex, postcode, "Postcode is required. Check the format.");
    ValidateRegex(emptyRegex, province, "Province is required.");
    ValidateRegex(positiveIntegerRegex, potSmall, "Enter quantity of Small Pots as an integer (no decimal places).");
    ValidateRegex(positiveIntegerRegex, potMedium, "Enter quantity of Medium Pots as an integer (no decimal places).");
    ValidateRegex(positiveIntegerRegex, potBig, "Enter quantity of Big Pots as an integer (no decimal places).");


    // ensure the customer buys at least one pot
    if (potSmall == 0 && potMedium == 0 && potBig == 0) {
        errors += `At least one product has to be selected.<br>`;
    }

    // displaying errors
    if (errors) {
        document.getElementById('errors').innerHTML = errors;
    }
    // receipt creation
    else {
        return true;
    }
    return false;
}
/*
//function for Regex validations
function ValidateRegex(regex, parameter, message) {
    if (!regex.test(parameter.trim())) {
        errors += `${message}<br>`;
    }
}
*/
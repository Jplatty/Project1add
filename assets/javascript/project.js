// ================== Display date =========================
displayDate();

// ===== Display and update current date and location ======
function displayDate() {
   $('#display-date').html(moment().format('dddd, MMM Do'))
}

// ================== Initialize Firebase ==================
var config = {
   apiKey: "AIzaSyAEzSXfQUyR8MWVsDiIIKB3Ga8kyVsmQGc",
   authDomain: "sweatgeak.firebaseapp.com",
   databaseURL: "https://sweatgeak.firebaseio.com",
   projectId: "sweatgeak",
   storageBucket: "",
   messagingSenderId: "112417968250"
}
firebase.initializeApp(config);

// Variable to reference database and child nodes.
var database = firebase.database();
var ref = database.ref('components');
var foodRef = ref.child('food-searched');
var userRef = ref.child('user-stats');

// =========================================================

// Global Variables
var foodSearched = [];
var personWeight = [];
var cals = [];
var fat = [];
var carb = [];
var prot = [];

var fatTotal = 0;
var carbTotal = 0;
var proteinsTotal = 0;
var caloriesTotal = 0;

// ===== Click event for user stats submit button. =====
$('#submitStats').on('click', function (event) {
   // Prevent early sumbission of form.
   event.preventDefault();

   // ----- User Stats Access -----
   var userNameFirst = $("#first-name").val().trim().toLowerCase();
   var userNameLast = $("#last-name").val().trim().toLowerCase();
   var userName = userNameFirst + " " + userNameLast;

   var userGender = $("#user-gender").val().trim().toLowerCase();
   var userAge = $("#user-age").val().trim();
   var userWeight = $("#user-weight").val().trim();
   var userHeight = $("#user-height").val().trim();
   var userActivity = $("input[name='optradio']:checked").val();

   // Debugging
   console.log("GENDER: " + userGender);
   console.log("AGE: " + userAge);
   console.log("WEIGHT: " + userWeight);
   console.log("HEIGHT: " + userHeight);
   console.log("ACTIVITY LVL: " + userActivity);

   // ----- Form validation for user profile input. All fields required. Checks if all fields are completed. -----
   if (userNameFirst === "" || userNameLast === "" || userGender === "" || userAge === "" || userWeight === "" || userHeight === "") {
      $('#missing-field').html('ALL fields are required.');
      return false;
   }
   // Check to make sure that there are no null(missing) values in form.
   else if (userNameFirst === null || userNameLast === null || userGender === null || userAge === null || userWeight === null || userHeight === null) {
      $('#missing-field').html('ALL fields are required.');
      return false;
   }
   // If form is valid, add and save user profile stats.
   else {
      $('#missing-field').empty();
      
   // Local temp object. Stores and holds user stats. 
   var userStats = {
      name: userName,
      gender: userGender,
      age: userAge,
      weight: userWeight,
      height: userHeight,
      activityLvl: userActivity
   }

   // Save and upload local user stats to firebase db.
   userRef.push(userStats);

     // Clear user input from text boxes.
     $("#first-name").val("");
     $("#last-name").val("");
     $('#user-gender').val("");
     $('#user-age').val("");
     $('#user-weight').val("");
     $('#user-height').val("");
     $("input[name='optradio']:checked").val("");
   }
});

// ========== ACCESS TO DB SNAPSHOT ===========
userRef.on('child_added', function (childSnapshot, prevChildKey) {
   console.log(childSnapshot.val());
   // console.log(prevChildKey);

   var name = childSnapshot.val().name;
   var gender = childSnapshot.val().gender;
   var age = childSnapshot.val().age;
   var weight = childSnapshot.val().weight;
   var height = childSnapshot.val().height;
   var activityLvl = childSnapshot.val().activityLvl;

   // Debugging
   console.log("NAME in db: " + name);
   console.log("GENDER in db: " + gender);
   console.log("AGE in db: " + age);
   console.log("WEIGHT in db: " + weight);
   console.log("HEIGHT in db: " + height);
   console.log("ACTIVITY LVL in db: " + activityLvl);

   // Pushing weight to global variable in order to use later
   personWeight.push(weight);
});

// ===== Click event for food search submit button. Upon user click, add food to log. =====
$('#submitBtn').on('click', function (event) {
   // Prevent early sumbission of form.
   event.preventDefault();
   // Empty foodSearched array after submission
   foodSearched = [];

   // Grab user input value from text box. Store value in variable.
   var foodInput = $('#add-food').val().trim().toLowerCase();
   console.log(foodInput);

   // ----- USDA NDBNO SEARCH -----
   var queryURL = "https://api.nal.usda.gov/ndb/search/?format=json&max=25&q=" + foodInput + "&api_key=XW46N28qWGss5QT8ZQkijzu2jPJ3RVehBMcaYKmy";

   $.ajax({
      url: queryURL,
      method: "GET"
   }).then(function (response) {
      // ----- FOOD/NUTRIENTS SEARCH: Utilizes ndbno produced by first USDA query -----
      var listOfItems = response.list.item;
      for (let index = 0; index < listOfItems.length; index++) {
         const item = listOfItems[index];
         var ndbno = item.ndbno;
         var queryURL2 = "https://api.nal.usda.gov/ndb/V2/reports?ndbno=" + ndbno + "&type=b&format=json&max=25&api_key=XW46N28qWGss5QT8ZQkijzu2jPJ3RVehBMcaYKmy"
         $.ajax({
            url: queryURL2,
            method: "GET"
         }).then(function (response) {
            // ----- MEAL LOG -----
            var name = response.foods[0].food.desc.name;
            var nutrients = response.foods[0].food.nutrients;
            var calories = nutrients.filter(nutrientObj => nutrientObj.name === "Energy")[0];
            var fats = nutrients.filter(nutrientObj => nutrientObj.name === "Total lipid (fat)")[0];
            var carbs = nutrients.filter(nutrientObj => nutrientObj.name === "Carbohydrate, by difference")[0];
            var proteins = nutrients.filter(nutrientObj => nutrientObj.name === "Protein")[0];

            // Debugging: send all food item data to console.
            console.log(
               name + ": Calories: " + calories.value + ": Fats: " + fats.value + ": Carbs: " + carbs.value + ": Proteins: " + proteins.value
            )
            // Local temporary object to store and hold food item data.
            var foodItemObj = {
               name: name,
               calories: calories.value,
               fats: fats.value,
               carbohydrates: carbs.value,
               proteins: proteins.value
            }

            // Save and upload local foodItem object to firebase db.
            foodSearched.push(foodItemObj);

            // Update HTML table to display most recent searched food in firebase db.
            var tRow = $('<tr>');
            // Create/save references to td element.
            var nameTd = $('<td>').text(name);
            nameTd.attr('data_id', foodSearched.length - 1)

            tRow.append(`<i class="fas fa-cart-plus" data_id=${foodSearched.length - 1}></i>`, nameTd);
            $('#tbody2').append(tRow);

            // Clear user input from text box after food added to log.
            $('#add-food').val("");
         })
      }
   })
});

// ===== Get snapshot of stored 'children' data upon initial load & subsequent value changes. =====
foodRef.on('child_added', function (childSnapshot, prevChildKey) {
   console.log(childSnapshot.val());
   // console.log(prevChildKey);
   var name = childSnapshot.val().name
   var calories = childSnapshot.val().calories
   var fats = childSnapshot.val().fats
   var carbohydrates = childSnapshot.val().carbohydrates
   var proteins = childSnapshot.val().proteins

   var calTotal = caloriesTotal += parseInt(calories);
   var fTotal = fatTotal += parseInt(fats);
   var cbTotal = carbTotal += parseInt(carbohydrates);
   var protTotal = proteinsTotal += parseInt(proteins);

   console.log("FOOD NAME: " + name);
   console.log("CALORIES SUM: " + caloriesTotal);
   console.log("PROTEINS SUM: " + proteinsTotal);
   console.log("CARBS SUM: " + carbTotal);
   console.log("FATS SUM: " + fatTotal);

   // Pushing selected items various macros to global variable in order to use for progress bar calculations.
   // Only way I could produce correct results and totals later on.
   cals.push(calTotal);
   fat.push(fTotal);
   carb.push(cbTotal);
   prot.push(protTotal);
  
   // Write calculated calories to html.
   $('#current-cal').text(calTotal)

   // Empty prior search options after proper food item selected.
   $('#tbody2').empty();

   // Call functions for macro progress circles
   populateFoodLog(childSnapshot.val());
   updateProgressCircle();
});

// ===== On click function of shopping cart icon. =====
$('body').on('click', '.fa-cart-plus', function (event) {
   // Prevent form from submitting.
   event.preventDefault();
   console.log(foodSearched)
   console.log(event.target.getAttribute('data_id'));
   var index = event.target.getAttribute('data_id');

   // Save and upload food searched data to firebase db.
   foodRef.push(foodSearched[index]);
});

// ===== Add chosen food items and hidden nutrients to user food log. =====
function populateFoodLog(foodSearched) {
   // Update HTML table to display most recent searched food in firebase db.
   var tRow = $('<tr>');
   // Create/save references to td element.
   var itemTd = $('<td>').text(foodSearched.name);
   var caloriesTd = $('<td>').text(foodSearched.calories);
   var fatsTd = $('<td>').text(foodSearched.fats);
   var carbsTd = $('<td>').text(foodSearched.carbohydrates);
   var proteinsTd = $('<td>').text(foodSearched.proteins);

   // Append table data to table row.
   tRow.append(itemTd, caloriesTd, fatsTd, carbsTd, proteinsTd);
   // Append table row to table body.
   $('#tbody').append(tRow);
};

// ===== Progress Indicators for Dashboard Macros =====
function updateProgressCircle(person) { 
  // SEE END OF PAGE FOR INTENDED CODE FUNCTIONALITY/FORMULAS. 
  // ESTIMATED, ARBITRARY NUMBERS USED IN PLACE OF NUTRIENT CALCULATIONS. NOT ENOUGHT TIME.
  
  // globalVariable[globalVariable.length - 1] : Confusing way to get correct sum of macros, but takes last index, which is all the arrays numbers added together
   var caloriesIndicator = cals[cals.length - 1] / 2400;    // 2400: arbitrary # for moderately active, young adult, female
   //console.log("current calories: " + caloriesIndicator)
   
   // Calculations for recommended PROTEIN intake based on user's weight.
   var userWeight = personWeight[personWeight.length - 1];   
   var proteinConverted = 0.36 * userWeight; 
   var proteinGramsConsumed = proteinConverted / 100;
   var proteinIndicator = prot[prot.length - 1] / proteinConverted;

   // Calculations for recommended CARBS intake based on user's total daily calories.
   var carbsIndicator = carb[carb.length - 1] / 275;    // 275: arbitrary #. ***Should be 45-65% of TOTAL DAILY CALORIES***
   // console.log(carbsIndicator)

   // Calculations for recommended FAT intake based on user's total daily calories.
   var fatsIndicator = fat[fat.length - 1] / 65   // 65: arbitrary #. ***Should be 20-35% of TOTAL DAILY CALORIES***
   // console.log(fatsIndicator)
   
   console.log("CURRENT USER WORKING WEIGHT: " + userWeight)

  // ----- Progress Indicators for CALORIES Consumed -----
  $('#cals-consumed').circleProgress({
      value: caloriesIndicator,
      emptyFill: '#dae8e8',
      animation: {
         duration: 1200,
         easing: 'circleProgressEasing'
      },
      animationStartValue: 0.0
   }).on('circle-animation-progress', function (event, p, v) {
      $(this).find('strong').html(Math.round(caloriesIndicator * 100) + '%');
   });

   // ----- Progress Indicators for Proteins Consumed -----
   $('#proteins-circle').circleProgress({
      value: proteinGramsConsumed,
      emptyFill: '#dae8e8',
      animation: {
         duration: 1200,
         easing: 'circleProgressEasing'
      },
      animationStartValue: 0.0
   }).on('circle-animation-progress', function (event, p, v) {
      $(this).find('strong').html(Math.round(proteinIndicator * 100) + '%');
   });

   // ----- Progress Indicators for Carbs Consumed -----
   $('#carbs').circleProgress({
      value: carbsIndicator,
      emptyFill: '#dae8e8',
      animation: {
         duration: 1200,
         easing: 'circleProgressEasing'
      },
      animationStartValue: 0.0
   }).on('circle-animation-progress', function (event, p, v) {
      $(this).find('strong').html(Math.round(carbsIndicator * 100) + '<i>%</i>');
   });

   // ----- Progress Indicators for Fats Consumed -----
   $('#fats').circleProgress({
      value: fatsIndicator,
      emptyFill: '#dae8e8',
      animation: {
         duration: 1200,
         easing: 'circleProgressEasing'
      },
      animationStartValue: 0.0
   }).on('circle-animation-progress', function (event, p, v) {
      $(this).find('strong').html(Math.round(fatsIndicator * 100) + '<i>%</i>');
   })
};

   // ================================= CALORIE CALCULATOR FORMULAS ============================================
   // BMR: amount of calories needed while at rest
   // Adult male: 66 + (6.3 x body weight in lbs.) + (12.9 x height in in) - (6.8 x age in yrs) = BMR 
   // Adult female: 655 + (4.3 x weight in lbs.) + (4.7 x height in in) - (4.7 x age in yrs) = BMR

   // To determine total daily calorie needs, multiply BMR by the appropriate activity factor, as follows:
      // Sedentary (little or no exercise) : Calorie-Calculation = BMR x 1.2
      // Lightly active (light exercise/sports 1-3 days/week) : Calorie-Calculation = BMR x 1.375
      // Moderately active (moderate exercise/sports 3-5 days/week) : Calorie-Calculation = BMR x 1.55
      // Very active (hard exercise/sports 6-7 days a week) : Calorie-Calculation = BMR x 1.725
      // Extra active (very hard exercise/sports & physical job or 2x training) : Calorie-Calculation = BMR x 1.9
   // ============================================================================================================
   
   // Would have looked something like this:
   // function calsPerDay() {
   //    function find(id) { return document.getElementById(id) }
    
   //    var age = find("age").value
   //    var height = find("height").value * 2.54
   //    var weight = find("weight").value / 2.2
   //    var result = 0
   //    if (find("male").checked) 
   //      result = 66.47 + (13.75 * weight) + (5.0 * height - (6.75 * age))
   //    else if (find("female").checked)
   //      result = 665.09 + (9.56 * weight) + (1.84 * height - (4.67 * age))
   //    find("totalCals").innerHTML = Math.round( result )
   //  }
   //  calsPerDay()



// Initialize Firebase


var config = {
    apiKey: "AIzaSyAyvNl7v3sVbWiIFPQT0d7J-qN4oVzAYxQ",
    authDomain: "upenntrainschedule.firebaseapp.com",
    databaseURL: "https://upenntrainschedule.firebaseio.com",
    projectId: "upenntrainschedule",
    storageBucket: "upenntrainschedule.appspot.com",
    messagingSenderId: "1042932856480"
};
firebase.initializeApp(config);

var database = firebase.database();

var provider = new firebase.auth.GoogleAuthProvider();




var main = {
    arrivalTime: 0,
    minutesRemain: 0,
    editing: false,

    nextArrivalGet: function (initialTime, frequency) {
        //take currentTime in formatn HH:mm, outputs next train time and minutes away
        var finitialTime = moment(initialTime, "HH:mm").subtract(1, "days");
        var fdiffTime = moment().diff(finitialTime, "minutes");
        var fremainder = fdiffTime % frequency;
        var fminutesRemain = frequency - fremainder;
        var farrival = moment().add(fminutesRemain, "minutes");

        main.minutesRemain = fminutesRemain;
        main.arrivalTime = farrival.format("HH:mm");
    },

    timeUpdate: function () {
        console.log(1);
        $(".trainInfoRow").each(function () {
            main.nextArrivalGet($(this).attr("data-initialTime"), $(this).children("#frequency").text());
            $("#clockTime").text(moment().format("HH:mm"));
            $(this).children("#nextTrain").text(main.arrivalTime);
            $(this).children("#minutesAway").text(main.minutesRemain);
        })
    },


    deleteInfo: function (info) {
        //info is the row of train information, deletes the row and remove from database
        var infokey = info.parent().parent().attr("data-key")
        info.parent().parent().remove();
        database.ref("/trainInfo").child(infokey).remove();
    },

    editInfo: function (info) {
        //info is this of event lister on edit button, allows editing of the row information by getting a resubmission of form and then make updates to DOM and database
        var infoRow = info.parent().parent()
        infoRow.addClass("editing")
        $("#formTitle").addClass("editing")
        var infokey = infoRow.attr("data-key")
        $("#submitButton").off()
        $("#submitButton").text("Complete Edit");
        $("#trainNameInput").val(infoRow.children("#trainName").text())
        $("#destinationInput").val(infoRow.children("#destination").text())
        $("#initialTimeInput").val(infoRow.attr("data-initialTime"))
        $("#frequencyInput").val(infoRow.children("#frequency").text())

        $("#submitButton").on("click", function () {

            event.preventDefault();
            var trainName = $("#trainNameInput").val().trim();
            var destination = $("#destinationInput").val().trim();
            var initialTime = $("#initialTimeInput").val().trim();
            var frequency = $("#frequencyInput").val().trim();

            database.ref("/trainInfo").child(infokey).set({
                trainName: trainName,
                destination: destination,
                initialTime: initialTime,
                frequency: frequency,
                dateAdded: firebase.database.ServerValue.TIMESTAMP
            })

            $("#trainNameInput").val("")
            $("#destinationInput").val("")
            $("#initialTimeInput").val("")
            $("#frequencyInput").val("")


            database.ref("/trainInfo").child(infokey).on("value", function (snapshot) {
                infoRow.children("#trainName").text(snapshot.val().trainName);
                infoRow.children("#destination").text(snapshot.val().destination);
                infoRow.children("#frequency").text(snapshot.val().frequency);
                infoRow.attr("data-initialTime", snapshot.val().initialTime);
                main.nextArrivalGet(snapshot.val().initialTime, snapshot.val().frequency);
                infoRow.children("#nextTrain").text(main.arrivalTime);
                infoRow.children("#minutesAway").text(main.minutesRemain);

            });
            main.editing = false;
            $("#submitButton").text("Submit");
            infoRow.removeClass("editing")
            $("#formTitle").removeClass("editing")
            $("#submitButton").off()
            $("#submitButton").on("click", function (event) {
                event.preventDefault();
                main.submitInfo();
            });
        });


    },



    trainInfoUpdate: function (trainInfo) {
        //grabs info from database append necessary information to table and create delete and edit button
        //create table jquery
        var newRow = $("<tr>");
        var trainNameCol = $("<td>").attr("id", "trainName");
        var destinationCol = $("<td>").attr("id", "destination");
        var frequencyCol = $("<td>").attr("id", "frequency");
        var nextTrainCol = $("<td>").attr("id", "nextTrain");
        var minutesAwayCol = $("<td>").attr("id", "minutesAway");
        var ButtonCol = $("<td>")
        //create buttons and assingn classes
        var deleteButton = $("<button>");
        var editButton = $("<button>").text("edit");
        editButton.addClass("btn btn-warning editButton")
        deleteButton.addClass("btn btn-danger deleteButton")
        deleteButton.text("X");
        ButtonCol.append(editButton)
        ButtonCol.append(deleteButton)
        //move database info to table
        trainNameCol.text(trainInfo.val().trainName);
        destinationCol.text(trainInfo.val().destination);
        frequencyCol.text(trainInfo.val().frequency);


        main.nextArrivalGet(trainInfo.val().initialTime, trainInfo.val().frequency)
        nextTrainCol.text(main.arrivalTime);
        minutesAwayCol.text(main.minutesRemain);



        newRow.attr("data-key", trainInfo.key)
        newRow.attr("data-initialTime", trainInfo.val().initialTime);
        newRow.addClass("trainInfoRow")


        newRow.append(trainNameCol, destinationCol, frequencyCol, nextTrainCol, minutesAwayCol, ButtonCol);
        $("#trainInfo").append(newRow)
    },

    submitInfo: function () {
        //grabs form information and update database
        var trainName = $("#trainNameInput").val().trim();
        var destination = $("#destinationInput").val().trim();
        var initialTime = $("#initialTimeInput").val().trim();
        var frequency = $("#frequencyInput").val().trim();
        $("#trainNameInput").val("")
        $("#destinationInput").val("")
        $("#initialTimeInput").val("")
        $("#frequencyInput").val("")
        database.ref("/trainInfo").push({
            trainName: trainName,
            destination: destination,
            initialTime: initialTime,
            frequency: frequency,
            dateAdded: firebase.database.ServerValue.TIMESTAMP
        })
    },
}


$(document).ready(function () {

    firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });

    setInterval(main.timeUpdate, 1000);

    database.ref("/trainInfo").on("child_added", function (snapshot) {
        main.trainInfoUpdate(snapshot);
    });

    $("#submitButton").on("click", function (event) {
        event.preventDefault();
        main.submitInfo("/trainInfo");

    });

    $(document).on("click", ".deleteButton", function () {
        if (!main.editing) {
            event.preventDefault();
            main.deleteInfo($(this))
        }
    })

    $(document).on("click", ".editButton", function () {
        if (!main.editing) {
            main.editing = true;
            main.editInfo($(this));
        }
    });

});


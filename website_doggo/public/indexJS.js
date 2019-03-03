var config = {
    apiKey: "AIzaSyCqIPoRIE3aYgARTrmhwi5JNzSob1FoXo8",
    authDomain: "hackmerced-2eeb3.firebaseapp.com",
    databaseURL: "https://hackmerced-2eeb3.firebaseio.com",
    projectId: "hackmerced-2eeb3",
    storageBucket: "hackmerced-2eeb3.appspot.com",
    messagingSenderId: "150471200685"
    };

    firebase.initializeApp(config);

    
    var fileButton = document.getElementById("reportBtn");
    var file;
    var storageRef;
  
    fileButton.addEventListener('change', function(e) {
    file = e.target.files[0];
    storageRef = firebase.storage().ref("testing/ " + file.name);
    });
  
    function submitButton() {
    storageRef.put(file);
    }
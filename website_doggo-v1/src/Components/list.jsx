import React, {Component} from 'react';
import firebase from "firebase";

class list extends Component {
    constructor(props) {
        super(props);
        this.getList = this.getList.bind(this);
    }

    getList() {
                // Initialize Firebase
        var config = {
            apiKey: "AIzaSyCqIPoRIE3aYgARTrmhwi5JNzSob1FoXo8",
            authDomain: "hackmerced-2eeb3.firebaseapp.com",
            databaseURL: "https://hackmerced-2eeb3.firebaseio.com",
            projectId: "hackmerced-2eeb3",
            storageBucket: "hackmerced-2eeb3.appspot.com",
            messagingSenderId: "150471200685"
        };
        firebase.initializeApp(config);
        var db = firebase.firestore();
        var docRef = db.collection("DogsNet").doc("download1.jpeg");

        docRef.get().then(function(doc) {
        if (doc.exists) {
        console.log("Document data:", doc.data());
        } else {
        // doc.data() will be undefined in this case
            console.log("No such document!");
        }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });

        // db.collection("DogsNet").get().then(function(querySnapshot) {
        //     querySnapshot.forEach(function(doc) {
        //         // doc.data() is never undefined for query doc snapshots
        //         console.log(doc.id, " => ", doc.data());
        //     });
        // });
    }

  render() {
    return (
      <div>
          <button onClick={this.getList}>data</button>
      </div>
    );
  }
}

export default list;

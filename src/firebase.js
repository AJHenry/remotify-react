// src/firebase.js
import firebase from 'firebase'

// Initialize Firebase
var config = {
    apiKey: "AIzaSyB3xA0cZH01cIKA4SzQ_A9Tspuip5tZvLM",
    authDomain: "remotify-bcf5b.firebaseapp.com",
    databaseURL: "https://remotify-bcf5b.firebaseio.com",
    projectId: "remotify-bcf5b",
    storageBucket: "remotify-bcf5b.appspot.com",
    messagingSenderId: "909211099473"
};

firebase.initializeApp(config);

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export default firebase;
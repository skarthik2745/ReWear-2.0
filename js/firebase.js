// Firebase configuration
window.firebaseConfig = {
  apiKey: "AIzaSyBcEN1JWel5O3SuXFu2j1dB2I_XZB_9-UU",
  authDomain: "rewear-latest.firebaseapp.com",
  projectId: "rewear-latest",
  storageBucket: "rewear-latest.appspot.com",
  messagingSenderId: "106378253936",
  appId: "1:106378253936:web:4a2d63a8d2e91ff20086b5",
  measurementId: "G-QL0H3Z8TVX",
  databaseURL: "https://rewear-latest-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
firebase.initializeApp(window.firebaseConfig);
window.auth = firebase.auth();
window.db = firebase.database();
window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

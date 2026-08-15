import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9jSkduOe-V27IYErRuVpHGuVVOQVawCw",
  authDomain: "gali-5bcca.firebaseapp.com",
  projectId: "gali-5bcca",
  storageBucket: "gali-5bcca.firebasestorage.app",
  messagingSenderId: "475065648992",
  appId: "1:475065648992:web:cc17cf82172d50ceab4005",
  measurementId: "G-H4PJ62265P",
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

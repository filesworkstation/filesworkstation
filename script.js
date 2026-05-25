// Firebase Modules integration via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tera Exact Web App Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBC7S5uJd9izO5qOV8W40T7KtNvGEk6oIU",
  authDomain: "filesworkstation-b3074.firebaseapp.com",
  projectId: "filesworkstation-b3074",
  storageBucket: "filesworkstation-b3074.firebasestorage.app",
  messagingSenderId: "922394201956",
  appId: "1:922394201956:web:7d18af7a9027103c0ab471",
  measurementId: "G-LY89J7ZMN8"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global UI States
let currentPageCount = 1;
let basePrice = parseInt(localStorage.getItem('selectedPrice')) || 5;
let currentProductTitle = localStorage.getItem('selectedTitle') || "Custom File Package";
let qrcodeHandler = null;

// Initial layout rendering when page loads
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('displayTitle')) {
        document.getElementById('displayTitle').innerText = currentProductTitle;
        document.getElementById('previewDocTitle').innerText = currentProductTitle;
        refreshCalculations();
    }
});

// Live Sync Text Input to A4 Canvas Preview Window
function updateLivePreview() {
    const rawValue = document.getElementById('studentName').value.trim();
    const targetPreviewNode = document.getElementById('liveStudentName');
    if (rawValue.length > 0) { 
        targetPreviewNode.innerText = rawValue; 
    } else { 
        targetPreviewNode.innerText = "Your Name"; 
    }
}
window.updateLivePreview = updateLivePreview;

// Adjust Page Quantity Multiplier Buttons
function adjustPages(modifier) {
    currentPageCount += modifier;
    if (currentPageCount < 1) currentPageCount = 1;
    refreshCalculations();
}
window.adjustPages = adjustPages;

// Reactive Calculation Engine
function refreshCalculations() {
    const netSum = currentPageCount * basePrice;
    document.getElementById('pageCount').innerText = currentPageCount;
    document.getElementById('totalAmount').innerText = netSum;
}

// Generate Native Deep Link UPI Payment QR Code
function processPaymentQR() {
    const studentNameInput = document.getElementById('studentName').value.trim();
    if (!studentNameInput) { 
        alert("Please enter the Student Name first!"); 
        return; 
    }

    const netSum = currentPageCount * basePrice;
    const merchantUpi = "fileworkstation@oksbi"; // Your Real Bank Account Virtual Address
    const businessBranding = "File Work Station";
    const upiPayloadUrl = `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(businessBranding)}&am=${netSum}&cu=INR`;

    document.getElementById('qrIdleState').classList.add('hidden');
    document.getElementById('qrActiveState').classList.remove('hidden');
    document.getElementById('qrLockedAmount').innerText = netSum;
    document.getElementById('qrcodeWrapper').innerHTML = "";

    qrcodeHandler = new QRCode(document.getElementById("qrcodeWrapper"), {
        text: upiPayloadUrl,
        width: 160,
        height: 160
    });
}
window.processPaymentQR = processPaymentQR;

// Send Transaction Request Directly to Cloud Firestore Database Collection
async function dispatchProof() {
    const transactionUtr = document.getElementById('utrField').value.trim();
    const studentNameInput = document.getElementById('studentName').value.trim();
    const netSum = currentPageCount * basePrice;

    if (!studentNameInput) { alert("Enter Student Name!"); return; }
    if (transactionUtr.length < 6) { alert("Enter valid 12-Digit UTR number!"); return; }

    const generatedOrderId = "FWS-" + Math.floor(100000 + Math.random() * 900000);

    // Final Core Payload Data Structure Packet
    const clientPayloadOrder = {
        orderId: generatedOrderId,
        name: studentNameInput,
        item: currentProductTitle,
        quantity: currentPageCount,
        amount: netSum,
        utr: transactionUtr,
        status: "Pending",
        downloadUrl: localStorage.getItem('deliverableFileUrl') || "#", // Secure attachment link tracking
        timestamp: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "orders"), clientPayloadOrder);
        
        // Storing tracking array local mappings inside customer session tracking list
        let userTrackingList = JSON.parse(localStorage.getItem('myFwsOrders')) || [];
        userTrackingList.push(generatedOrderId);
        localStorage.setItem('myFwsOrders', JSON.stringify(userTrackingList));
        
        alert("Order Proof Submitted successfully to Firebase Cloud!");
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Firebase Insertion Error: ", error);
        alert("Database connection timed out. Check if your Firebase console configurations match.");
    }
}
window.dispatchProof = dispatchProof;
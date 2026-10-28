// =====================================================
// FIREBASE CONFIG (cloud save, Google login, leaderboards)
// -----------------------------------------------------
// Leave as null and the game works exactly as before, with
// everything saved on this device only. To turn the cloud
// features on, paste your project's web config here (Firebase
// console → Project settings → Your apps → Web app → Config).
// These values are public identifiers, not secrets: access is
// protected by the Firestore rules (see README.md, "Cloud save").
// =====================================================

export const firebaseConfig = {
    apiKey: "AIzaSyC5VrKGfTwAaQc07wRkaRukTqj5Whm1rvo",
    authDomain: "pokemon-double.firebaseapp.com",
    projectId: "pokemon-double",
    storageBucket: "pokemon-double.firebasestorage.app"
};

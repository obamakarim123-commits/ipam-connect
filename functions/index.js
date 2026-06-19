const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {getFirestore} = require("firebase-admin/firestore");
const admin = require("firebase-admin");

// Initialize Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.redeemClassRepCode = onCall(async (request) => {
  const db = getFirestore();

  // 1. Ensure the user is authenticated in your Web app
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userId = request.auth.uid;
  const submittedCode = request.data.code;

  // 2. Find and check the code document
  const codeRef = db.collection("oneTimeCodes").doc(submittedCode);
  const codeDoc = await codeRef.get();

  if (!codeDoc.exists || !codeDoc.data().isValid) {
    throw new HttpsError(
      "invalid-argument",
      "This code is invalid or has already been used."
    );
  }

  const codeData = codeDoc.data();

  // 3. Update the user's role to class_rep in Firestore
  const userRef = db.collection("users").doc(userId);
  await userRef.update({
    role: "class_rep",
    department: codeData.assignedDepartment,
    level: codeData.assignedLevel,
  });

  // 4. Deactivate the one-time code
  await codeRef.update({isValid: false});

  return {success: true, message: "Successfully upgraded to class_rep!"};
});

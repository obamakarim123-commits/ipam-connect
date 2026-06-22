const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {getFirestore} = require("firebase-admin/firestore");
const admin = require("firebase-admin");

// Initialize Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Sends FCM push notification when a new message is created.
 */
exports.sendMessageNotification = onDocumentCreated(
    "messages/{messageId}", async (event) => {
      const message = event.data.data();
      if (!message || message.senderId === undefined) return;

      const db = getFirestore();
      const senderSnap = await db.collection("users")
          .doc(message.senderId).get();
      const senderName = senderSnap.exists ?
      senderSnap.data().fullName || "Someone" : "Someone";

      // Fetch all users' FCM tokens (excluding the sender)
      const usersSnap = await db.collection("users").get();
      const tokens = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.fcmToken && doc.id !== message.senderId) {
          tokens.push(data.fcmToken);
        }
      });

      if (tokens.length === 0) return;

      const payload = {
        notification: {
          title: senderName,
          body: message.text ?
          message.text.substring(0, 100) :
          "Sent an attachment",
        },
        tokens,
      };

      try {
        const response = await admin.messaging()
            .sendEachForMulticast(payload);
        if (response.failureCount > 0) {
          const batch = db.batch();
          response.responses.forEach((resp, idx) => {
            if (!resp.success &&
              resp.error.code === "messaging/invalid-registration-token") {
              const userQuery = db.collection("users")
                  .where("fcmToken", "==", tokens[idx]);
              userQuery.get().then((snap) => {
                snap.forEach((userDoc) => {
                  batch.update(userDoc.ref, {fcmToken: null});
                });
                batch.commit();
              });
            }
          });
        }
      } catch (e) {
        console.error("FCM send failed:", e.message);
      }
    });

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
        "This code is invalid or has already been used.",
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

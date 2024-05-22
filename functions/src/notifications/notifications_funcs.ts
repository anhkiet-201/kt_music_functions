import {onCall} from "firebase-functions/v2/https";
import {firestore} from "../global/global";

export const markNotificationsAsRead = onCall(async (request) => {
  const uid = request.auth?.uid;
  const notificationId = request.data.id;
  if (uid == null || notificationId == null) return;
  await firestore
    .collection("User")
    .doc(uid)
    .collection("notifications")
    .doc(notificationId)
    .update({
      isReaded: true,
    });
  return;
});

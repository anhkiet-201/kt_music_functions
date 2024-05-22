import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {Notification} from "../types/notification";
import Stripe from "stripe";
import {messaging} from "firebase-admin";
import {Artist} from "../types/artist";

export const app = initializeApp();
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export const firestore = getFirestore();
export const storage = getStorage(app);

export const sendNotifications = async (
  notification: Notification,
  uid: string) => {
  const data = (await firestore
    .collection("User")
    .doc(uid)
    .collection("fcm_tokens").get()).docs;
  if (data.length < 1) return;
  const messages = data.map(
    (value) => value
      .data()
      .token
  )
    .map((value) => (
      {
        token: value,
        notification: {
          title: notification.title,
          body: notification.content,
          imageUrl: notification.image,
        },
      }
    ));
  await firestore
    .collection("User")
    .doc(uid)
    .collection("notifications")
    .doc(notification.id)
    .set(notification);
  await messaging().sendEach(messages);
  return;
};

export const sendNotificationsToArtist = async (
  notification: Notification,
  artistId: string) => {
  const artist = (await firestore
    .collection("Artist")
    .doc(artistId)
    .get()
    ).data() as unknown as Artist;
  if (artist?.uid == null) return;
  sendNotifications(
    notification,
    artist.uid
  );
};

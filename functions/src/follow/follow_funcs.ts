import {onCall} from "firebase-functions/v2/https";
import {firestore} from "../global/global";
import {Follower} from "../types/follower";
import {messaging} from "firebase-admin";
import {Artist} from "../types/artist";
import {Notification} from "../types/notification";
import {generateShortID} from "../utils";
import {FieldValue} from "firebase-admin/firestore";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions/v1";

export const followById = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (uid == null) return;
  const type = request.data.type;
  const followId = request.data.followId;
  const follow: Follower = {
    id: generateShortID(),
    type: type,
    uid: uid,
    followId: followId,
    time: Date.now(),
  };
  await firestore
    .collection("Follow")
    .doc(follow.id)
    .set(follow, {merge: true});
  await firestore.collection("User").doc(uid).update({
    following: FieldValue.increment(1),
  });
  switch (type) {
  case "user": {
    await firestore.collection("User").doc(follow.followId).update({
      follower: FieldValue.increment(1),
    });
  }
    break;
  case "artist": {
    await firestore.collection("Artist").doc(follow.followId).update({
      follower: FieldValue.increment(1),
    });
  }
    break;
  default: return;
  }
});

export const unFollowById = onCall(async (request) => {
  try {
    const uid = request.auth?.uid;
    const type = request.data.type;
    const followId = request.data.id;
    if (uid == null || followById == null) return;
    await firestore
      .collection("Follow")
      .doc(followId)
      .delete();
    await firestore.collection("User").doc(uid).update({
      following: FieldValue.increment,
    });
    switch (type) {
    case "user": {
      await firestore.collection("User").doc(followId).update({
        follower: FieldValue.increment(-1),
      });
    }
      break;
    case "artist": {
      await firestore.collection("Artist").doc(followId).update({
        follower: FieldValue.increment(-1),
      });
    }
      break;
    default: return;
    }
  } catch (error) {
    logger.error(error);
  }
});

export const sendNotificationsWhenFollow = onDocumentCreated(
  "Follow/{id}", async (event) => {
    const follow = event.data?.data();
    if (follow == null) return;
    let targetUid;
    switch (follow.type) {
    case "user": {
      targetUid = follow.followId;
    }
      break;
    case "artist": {
      const artist = (await firestore
        .collection("Artist")
        .doc(follow.followId)
        .get())
        .data() as unknown as Artist;
      targetUid = artist?.uid;
    }
      break;
    default: return;
    }
    if (targetUid == null) return;
    const user = (await firestore
      .collection("User")
      .doc(follow.uid)
      .get()).data();
    if (user == null) return;
    const data = (await firestore
      .collection("User")
      .doc(targetUid)
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
            title: "You have new followers",
            body: `${user.name} just followed you`,
            imageUrl: user.avatar,
          },
        }
      ));
    const notification: Notification = {
      id: generateShortID(),
      title: "You have new followers",
      content: `${user.name} just followed you`,
      time: Date.now(),
      image: user.avatar,
      url: "http://datn-578a6.web.app/notifications/action/" + user.uid,
    };
    await firestore
      .collection("User")
      .doc(targetUid)
      .collection("notifications")
      .doc(notification.id)
      .set(notification);
    await messaging().sendEach(messages);
    return;
  });

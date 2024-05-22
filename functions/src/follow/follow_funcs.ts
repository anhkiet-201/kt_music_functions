import {onCall} from "firebase-functions/v2/https";
import {firestore, sendNotifications} from "../global/global";
import {Follower} from "../types/follower";
import {Artist} from "../types/artist";
import {Notification} from "../types/notification";
import {generateShortID} from "../utils";
import {FieldValue} from "firebase-admin/firestore";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions/v1";

export const followById = onCall(async (request) => {
  try {
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
  } catch (error) {
    logger.error(error);
  }
});

export const unFollowById = onCall(async (request) => {
  try {
    const uid = request.auth?.uid;
    const type = request.data.type;
    const followId = request.data.id;
    if (uid == null || followById == null) return;
    const follow = (
      await firestore
        .collection("Follow")
        .doc(followId)
        .get()
    ).data();
    await firestore
      .collection("Follow")
      .doc(followId)
      .delete();
    await firestore.collection("User").doc(uid).update({
      following: FieldValue.increment(-1),
    });
    switch (type) {
    case "user": {
      await firestore
        .collection("User")
        .doc(follow!.followId)
        .update({
          follower: FieldValue.increment(-1),
        });
    }
      break;
    case "artist": {
      await firestore
        .collection("Artist")
        .doc(follow!.followId)
        .update({
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
    const notification: Notification = {
      id: generateShortID(),
      title: "You have new followers",
      content: `${user.name} just followed ${follow.type} profile of you`,
      time: Date.now(),
      image: user.avatar,
      url: "http://datn-578a6.web.app/deeplinks/action?mode=openProfile&uid="+user.uuid,
      isReaded: false,
    };
    sendNotifications(notification, targetUid);
    return;
  });

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {Sentiment, SentimentProfileType} from "../types/sentiment";
import {firestore, sendNotifications} from "../global/global";
import {Follower} from "../types/follower";
import {Notification} from "../types/notification";
import {generateShortID} from "../utils";

export const onSentimentCreate = onDocumentCreated(
  "Sentiment/{id}",
  async (event) => {
    const data = event.data?.data() as unknown as Sentiment;
    if (data == null) return;
    // / get follower
    const docs = (await firestore
      .collection("Follow")
      .where(
        "followId",
        "==",
        data.profile.profileId
      ).get()).docs;
    const profile = (await firestore
      .collection(data.profile.type == "user" ? "User" : "Artist")
      .doc(data.profile.profileId)
      .get()).data();
    for (const f of docs) {
      const follow = f.data() as unknown as Follower;
      if (follow == null) continue;
      const notification: Notification = {
        id: generateShortID(),
        title: "You have new followers",
        content: `${profile?.name} you're following posted a new sentiment.`,
        time: Date.now(),
        image: data.profile.type == SentimentProfileType.user ?
          profile?.avatar :
          profile?.thumbnail,
        url: "http://datn-578a6.web.app/deeplinks/action?mode=openSentiment&id=" + data.id,
        isReaded: false,
      };
      sendNotifications(notification, follow.uid);
    }
    return;
  }
);

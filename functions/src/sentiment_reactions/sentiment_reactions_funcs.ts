import {
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import {
  firestore,
  sendNotifications,
  sendNotificationsToArtist,
} from "../global/global";
import {Sentiment, SentimentProfileType} from "../types/sentiment";
import {Notification} from "../types/notification";
import {generateShortID} from "../utils";

export const onReaction = onDocumentWritten(
  "Sentiment/{sentimentId}/reactions/{reactionId}",
  async (event) => {
    // / get Sentiment
    const sentiment = (await firestore
      .collection("Sentiment")
      .doc(event.params.sentimentId)
      .get()).data() as Sentiment;
    updateMetaData(sentiment);
    const data = event.data?.after.data();
    if (data == null) return;
    if (
      data.profile.profileId ==
          sentiment.profile.profileId) {
      return;
    }
    // / get Profile
    const profile = (await firestore
      .collection(data.profile.type == "user" ? "User" : "Artist")
      .doc(data.profile.profileId)
      .get()).data();
    // / send Notifications
    const notification: Notification = {
      id: generateShortID(),
      title: "You have new reaction",
      content:
          `${profile?.name ?? ""} has expressed his feelings in your Sentiment`,
      time: Date.now(),
      image: data.profile.type == "user" ?
        profile?.avatar :
        profile?.thumbnail,
      url:
      "http://datn-578a6.web.app/deeplinks/action?mode=openSentiment&id=" + sentiment.id,
      isReaded: false,
    };
    switch (sentiment.profile.type) {
    case SentimentProfileType.user: {
      sendNotifications(
        notification,
        sentiment.profile.profileId
      );
    }
      break;
    case SentimentProfileType.artist: {
      sendNotificationsToArtist(
        notification,
        sentiment.profile.profileId
      );
    }
      break;
    }
    return;
  }
);

export const updateMetaData = async (sentiment: Sentiment) => {
  const countReaction = (
    await firestore
      .collection("Sentiment")
      .doc(sentiment.id)
      .collection("reactions")
      .count().get()
  ).data().count;
  const countComment = (
    await firestore
      .collection("Sentiment")
      .doc(sentiment.id)
      .collection("comments")
      .count().get()
  ).data().count;
  await firestore
    .collection("Sentiment")
    .doc(sentiment.id)
    .update(
      {
        "meta_data": {
          "total_reaction": countReaction,
          "total_comment": countComment,
          "created_at": sentiment.meta_data.created_at,
          "updated_at": Date.now(),
        },
      }
    );
  return;
};

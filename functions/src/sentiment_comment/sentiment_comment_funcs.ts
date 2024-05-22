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
import {updateMetaData} from "../sentiment_reactions/sentiment_reactions_funcs";

export const onComment = onDocumentWritten(
  "Sentiment/{sentimentId}/comments/{commentId}",
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
      .collection(
        data.profile.type == "user" ? "User" : "Artist")
      .doc(data.profile.profileId)
      .get()).data();
    // / send Notifications
    const notification: Notification = {
      id: generateShortID(),
      title: "You have new a comment",
      content:
                `${profile?.name ?? ""} commented on your Sentiment.`,
      time: Date.now(),
      image: data.profile.type == "user" ?
        profile?.avatar :
        profile?.thumbnail,
      url: "",
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

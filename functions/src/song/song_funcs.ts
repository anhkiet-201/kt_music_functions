import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {
  descrementTagsMetaData,
  incrementTagsMetaData} from "../types/tags_meta_data";
import {firestore, sendNotifications, storage} from "../global/global";
import {Song} from "../types/song";
import {onCall} from "firebase-functions/v2/https";
import {Artist} from "../types/artist";
import {Notification} from "../types/notification";
import {generateShortID} from "../utils";
import {Follower} from "../types/follower";

export const onSongWrite = onDocumentWritten(
  "Song/{songId}",
  (event) => {
    const oldData = event.data?.before.data();
    const newData = event.data?.after.data();
    // / Create
    if (oldData == undefined && newData != undefined) {
      onSongCreate(newData as Song);
      return;
    }

    // / Update
    if (oldData != undefined && newData != undefined) {
      onSongUpdate(oldData as Song, newData as Song);
      return;
    }

    // / Delete
    if (oldData != undefined && newData == undefined) {
      onSongDelete(oldData as Song);
      return;
    }
  }
);

const onSongCreate = async (song: Song) => {
  for (const tag of song.tags) {
    incrementTagsMetaData(tag);
  }
};

const onSongUpdate = async (oldData: Song, newData: Song) => {
  // / Delete old resource
  const bucket = storage.bucket();
  if (oldData.cover !== newData.cover) {
    bucket.file(oldData.cover).delete();
  }
  if (oldData.url !== newData.url) {
    bucket.file(oldData.url).delete();
  }
  const newTags = newData.tags
    .filter((value) => (!oldData.tags.includes(value)));
  const removedTags = oldData.tags
    .filter((value) => (!newData.tags.includes(value)));

  // / Increment new tag
  for (const tag of newTags) {
    incrementTagsMetaData(tag);
  }

  // / Descrement old tag
  for (const tag of removedTags) {
    descrementTagsMetaData(tag);
  }
};

const onSongDelete = async (song: Song) => {
  for (const tag of song.tags) {
    descrementTagsMetaData(tag);
  }
};

export const onPlaySongWithId = onCall(async (request) => {
  const songId = request.data.songId;
  if (songId == null || request.auth == null) return;
  const song = (await firestore
    .collection("Song")
    .doc(songId)
    .get()).data();
  if (song == null) return;
  await firestore.collection("Song").doc(songId).update({
    listenCount: song.listenCount + 1,
  });
  const artist = (await firestore
    .collection("Artist")
    .doc(song.artistId)
    .get()).data();
  if (artist == null) return;
  await firestore.collection("Artist").doc(song.artistId).update({
    totalListenCount: artist.totalListenCount + 1,
  });
  return;
});

export const sendNotificationsWhenCreateSong = async (song: Song) => {
  const artist = (
    await firestore
      .collection("Artist")
      .doc(song.artistId)
      .get()
  ).data() as unknown as Artist;
  if (artist == null) return;
  const notification: Notification = {
    id: generateShortID(),
    title: "A new song has been uploaded",
    content:
    `The ${artist.name} artist you're interested in just uploaded a new song`,
    time: Date.now(),
    image: song.cover,
    url: "http://datn-578a6.web.app/deeplinks/action?mode=openSong&id=" + song.id,
    isReaded: false,
  };
  // / get follower
  const followers = (
    await firestore
      .collection("Follow")
      .where(
        "followId",
        "==",
        song.artistId
      ).get()
  ).docs;
  for (const doc of followers) {
    const data = doc.data() as unknown as Follower;
    if (data == null) continue;
    sendNotifications(notification, data.uid);
  }
  return;
};

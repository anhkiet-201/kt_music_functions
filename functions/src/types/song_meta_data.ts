import {firestore} from "../global/global";
import {logger} from "firebase-functions/v1";

export type SongMetaData = {
    songId: string,
    numberAddPlaylist: number,
    publicDate: number,
    lastUpdate: number,
}

export const createSongMetaData = (id: string): SongMetaData => ({
  songId: id,
  numberAddPlaylist: 0,
  publicDate: Date.now(),
  lastUpdate: Date.now(),
});

export const incrementAddPlaylistCount = async (id: string) => {
  logger.info("Getting data");
  const data = (await firestore
    .collection("SongsMetaData")
    .doc(id).get())
    .data() ?? createSongMetaData(id);
  data.numberAddPlaylist += 1;
  data.lastUpdate = Date.now();
  logger.info("Increment SongsMetaData");
  await firestore.collection("SongsMetaData").doc(id).set(data, {merge: true});
  logger.info("Done");
};

export const descrementAddPlaylistCount = async (id: string) => {
  logger.info("Getting data");
  const data = (await firestore
    .collection("SongsMetaData")
    .doc(id)
    .get()).data();
  if (data == undefined) return;
  data.numberAddPlaylist -= 1;
  data.lastUpdate = Date.now();
  logger.info("Descrement SongsMetaData");
  await firestore.collection("SongsMetaData").doc(id).set(data, {merge: true});
  logger.info("Done");
};

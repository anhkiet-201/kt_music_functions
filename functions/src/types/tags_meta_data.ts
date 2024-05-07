import {firestore} from "../global/global";

export type TagsMetaData = {
    name: string,
    numberOfUses: number,
    publicDate: number,
    lastUpdate: number
}

export const createTagsMetaData = (name: string): TagsMetaData => ({
  name: name,
  numberOfUses: 0,
  publicDate: Date.now(),
  lastUpdate: Date.now(),
});

export const incrementTagsMetaData = async (tag: string) => {
  const data = (await firestore
    .collection("TagsMetaData")
    .doc(tag).get())
    .data() ?? createTagsMetaData(tag);
  data.numberOfUses += 1;
  data.lastUpdate = Date.now();
  firestore.collection("TagsMetaData").doc(tag).set(data, {merge: true});
};

export const descrementTagsMetaData = async (tag: string) => {
  const data = (await firestore
    .collection("TagsMetaData")
    .doc(tag)
    .get()).data();
  if (data == undefined) return;
  data.numberOfUses -= 1;
  data.lastUpdate = Date.now();
  firestore.collection("TagsMetaData").doc(tag).set(data, {merge: true});
};

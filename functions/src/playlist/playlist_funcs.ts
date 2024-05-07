import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {Playlist} from "../types/playlist";
import {
  descrementAddPlaylistCount,
  incrementAddPlaylistCount} from "../types/song_meta_data";

export const onPlaylistWrite = onDocumentWritten(
  "Playlist/{playlistId}",
  (event) => {
    const oldData = event.data?.before.data();
    const newData = event.data?.after.data();
    // / Create
    if (oldData == undefined && newData != undefined) {
      onPlaylistCreate(newData as Playlist);
      return;
    }

    // / Update
    if (oldData != undefined && newData != undefined) {
      onPlaylistUpdate(oldData as Playlist, newData as Playlist);
      return;
    }

    // / Delete
    if (oldData != undefined && newData == undefined) {
      onPlaylistDelete(oldData as Playlist);
      return;
    }
  }
);

const onPlaylistCreate = async (playlist: Playlist) => {
  for (const song of playlist.songs) {
    incrementAddPlaylistCount(song);
  }
};


const onPlaylistUpdate = async (oldData: Playlist, newData: Playlist) => {
  const newSongs = newData.songs
    .filter((value) => (!oldData.songs.includes(value)));
  const removedSongs = oldData.songs
    .filter((value) => (!newData.songs.includes(value)));

  // / Increment new tag
  for (const song of newSongs) {
    incrementAddPlaylistCount(song);
  }

  // / Descrement old tag
  for (const song of removedSongs) {
    descrementAddPlaylistCount(song);
  }
};

const onPlaylistDelete = async (playlist: Playlist) => {
  for (const song of playlist.songs) {
    descrementAddPlaylistCount(song);
  }
};

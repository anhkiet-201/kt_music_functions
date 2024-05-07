export type Playlist = {
    avatarPlaylist?: string,
    description?: string,
    id: string,
    isPublic: boolean,
    listenCount: number,
    name: string,
    reactionCount: number,
    songs: string[],
    extraData: PlaylistExtraData
}

export type PlaylistExtraData = {
    createdAt: number,
    ownerId: string,
    type: PlaylistType,
    updatedAt: number
}

export enum PlaylistType {
    playlist,
    album
}

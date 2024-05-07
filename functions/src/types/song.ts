export type Song = {
    artistId: string,
    cover: string,
    description?: string,
    duration: number,
    id: string,
    listenCount: number,
    lyric?: string,
    name: string,
    otherArtist: string[],
    token: string,
    uploadTime: number,
    url: string,
    tags: string[]
}

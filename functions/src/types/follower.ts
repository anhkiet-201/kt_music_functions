export type Follower = {
    id: string,
    type: FollowType,
    uid: string,
    followId: string,
    time: number
}

export enum FollowType {
    artist,
    user
}

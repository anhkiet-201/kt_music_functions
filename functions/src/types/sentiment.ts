export interface Sentiment {
    id: string;
    content: string;
    isPublic: boolean;
    meta_data: SentimentMetaData;
    profile: SentimentProfile;
}

export type SentimentMetaData = {
    created_at: number,
    total_comment: number,
    total_reaction: number,
    updated_at: number,
}

export type SentimentProfile = {
    profileId: string,
    type: SentimentProfileType
}

export enum SentimentProfileType {
    user = "user",
    artist = "artist"
}

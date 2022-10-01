import { Manager, Plugin } from '@drgatoxd/erelajs';
export declare class Erelasfy extends Plugin {
    private BASE_URL;
    private _search;
    private regexp;
    options: ErelasfyOptions;
    authorization: string;
    token: string;
    manager: Manager;
    constructor(options: ErelasfyOptions);
    load(manager: Manager): void;
    private getMethod;
    private search;
    private getTrack;
    private getAlbumTracks;
    private getPlaylistTracks;
    private makeRequest;
    private renewToken;
    private renew;
    private buildUnresolved;
    private resolve;
    static filterNullOrUndefined(value: unknown): value is unknown;
}
export interface ErelasfyOptions {
    clientId: string;
    clientSecret: string;
    playlistLimit?: number;
    albumLimit?: number;
}
export interface UnresolvedTrack {
    info: {
        identifier: string;
        title: string;
        author: string;
        uri: string;
        length: number;
        thumbnail: string;
        isrc: string;
    };
    resolve: () => Promise<LavalinkTrack | undefined>;
}
export interface LavalinkTrack {
    track: string;
    info: {
        identifier: string;
        isSeekable: boolean;
        author: string;
        length: number;
        isStream: boolean;
        position: number;
        title: string;
        uri: string;
        thumbnail: string;
    };
}
export interface LavalinkResponse<T = UnresolvedTrack | LavalinkTrack> {
    loadType: 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';
    playlistInfo: {
        name?: string;
        selectedTrack?: number;
    };
    tracks: T[];
    exception?: {
        message: string;
        severity: string;
    };
}
export interface Result {
    tracks: UnresolvedTrack[];
    name?: string;
    thumbnail?: string;
}
export declare type DeepUnpartial<T> = {
    [P in keyof T]-?: T[P] extends Record<string, unknown> ? DeepUnpartial<T[P]> : T[P];
};

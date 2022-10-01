import type {
	SpotifyAlbum,
	SpotifyAlbumTracks,
	SpotifyPlaylist,
	SpotifyPlaylistTracks,
	SpotifyTokenResponse,
	SpotifyTrack
} from './typings/Spotify';
import { DefaultOptions } from './constants';
import {
	LoadType,
	Manager,
	Plugin,
	SearchQuery,
	SearchResult,
	TrackUtils
} from '@drgatoxd/erelajs';
import { validateOptions } from './util/validate';
import axios from 'axios';
import { buildSearch } from './util/buildSearch';

export class Erelasfy extends Plugin {
	private BASE_URL = 'https://api.spotify.com/v1';
	private _search!: (query: string | SearchQuery, requester?: unknown) => Promise<SearchResult>;
	private regexp =
		/(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(track|playlist|album)[\/:]([A-Za-z0-9]+)/;

	public options: ErelasfyOptions;
	public authorization: string;
	public token = '';
	public manager!: Manager;

	public constructor(options: ErelasfyOptions) {
		super();
		validateOptions(options);
		this.options = { ...DefaultOptions, ...options };
		this.authorization = `Basic ${Buffer.from(
			`${options.clientId}:${options.clientSecret}`
		).toString('base64')}`;

		void this.renew();
	}

	public override load(manager: Manager) {
		this.manager = manager;
		this._search = manager.search.bind(manager);
		manager.search = this.search.bind(this);
	}

	private getMethod(url: string) {
		const [, type] = url.match(this.regexp) ?? [];
		return type == 'track'
			? this.getTrack
			: type == 'album'
			? this.getAlbumTracks
			: type == 'playlist'
			? this.getPlaylistTracks
			: undefined;
	}

	private async search(query: string | SearchQuery, requester?: unknown) {
		const finalQuery = typeof query == 'string' ? query : query.query;
		const [, type, id] = finalQuery.match(this.regexp) ?? [];

		const func = this.getMethod(finalQuery)?.bind(this);

		if (id != undefined && func && type) {
			try {
				const data: Result = await func(id);

				const loadType = type === 'track' ? 'TRACK_LOADED' : 'PLAYLIST_LOADED';
				const name = ['playlist', 'album'].includes(type) ? data.name || null : null;

				const tracks = (
					await Promise.all(
						data.tracks.map(async query => {
							const track = query.resolve();
							return track;
						})
					)
				)
					.filter(track => !!track)
					.map(t => TrackUtils.build(t!, requester));

				return buildSearch(loadType, tracks, null, name);
			} catch (err) {
				console.log(err);

				const e = err as { loadType: LoadType; message: string };
				return buildSearch(e.loadType ?? 'LOAD_FAILED', null, e.message ?? null, null);
			}
		} else {
			return this._search(query, requester);
		}
	}

	private async getTrack(id: string): Promise<Result> {
		const data = await this.makeRequest<SpotifyTrack>(`/tracks/${id}`);
		return { tracks: [this.buildUnresolved(data)] };
	}

	private async getAlbumTracks(id: string): Promise<Result> {
		const album = await this.makeRequest<SpotifyAlbum>(`/albums/${id}`);
		const tracks = await Promise.all(
			album.tracks.items.filter(Erelasfy.filterNullOrUndefined).map(item => this.getTrack(item.id))
		);
		let next = album.tracks.next;
		let page = 1;

		while (
			next != null &&
			(!this.options.albumLimit ? true : page < (this.options.albumLimit || 50))
		) {
			const nextPage = await this.makeRequest<SpotifyAlbumTracks>(next!);
			const nextTracks = await Promise.all(
				nextPage.items.filter(Erelasfy.filterNullOrUndefined).map(item => this.getTrack(item.id))
			);
			tracks.push(...nextTracks);
			next = nextPage.next;
			page++;
		}

		return { tracks: tracks.map(x => x.tracks[0]!), name: album.name };
	}

	private async getPlaylistTracks(id: string): Promise<Result> {
		const playlist = await this.makeRequest<SpotifyPlaylist>(`/playlists/${id}`);
		const tracks = playlist.tracks.items
			.filter(Erelasfy.filterNullOrUndefined)
			.map(x => this.buildUnresolved(x.track));

		let next = playlist.tracks.next;
		let page = 1;

		while (
			next != null &&
			(!this.options.albumLimit ? true : page < (this.options.albumLimit || 50))
		) {
			const nextPage = await this.makeRequest<SpotifyPlaylistTracks>(next!);
			const nextTracks = nextPage.items
				.filter(Erelasfy.filterNullOrUndefined)
				.map(x => this.buildUnresolved(x.track));
			tracks.push(...nextTracks);
			next = nextPage.next;
			page++;
		}

		return { tracks, name: playlist.name, thumbnail: playlist.images[0]?.url };
	}

	private async makeRequest<T>(endpoint: string): Promise<T> {
		const res = await axios({
			method: 'GET',
			url: `${this.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
			headers: {
				Authorization: this.token
			}
		});

		return res.data;
	}

	private async renewToken() {
		const {
			data: { access_token, expires_in }
		}: { data: SpotifyTokenResponse } = await axios({
			method: 'POST',
			url: 'https://accounts.spotify.com/api/token',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: this.authorization
			},
			params: {
				grant_type: 'client_credentials'
			}
		}).catch(() => ({ data: { access_token: null, expires_in: null } }));

		if (!access_token || !expires_in) {
			throw new Error('Invalid Spotify client.');
		}

		this.token = `Bearer ${access_token}`;
		return expires_in * 1000;
	}

	private async renew(): Promise<void> {
		const expiresIn = await this.renewToken();
		setTimeout(() => this.renew(), expiresIn);
	}

	private buildUnresolved(track: SpotifyTrack): UnresolvedTrack {
		const _this = this;

		return {
			info: {
				identifier: track.id,
				title: track.name,
				author: track.artists[0]?.name || 'Unknown',
				uri: track.external_urls.spotify,
				length: track.duration_ms,
				thumbnail:
					track.album?.images[0]?.url ||
					'https://m.media-amazon.com/images/I/61T60YWIp3L._SS500_.jpg',
				isrc: track.external_ids?.isrc
			},
			resolve() {
				return _this.resolve(this);
			}
		};
	}

	private async resolve(track: UnresolvedTrack) {
		if (!this.manager) throw new Error('No manager found.');

		const params = new URLSearchParams({
			identifier: `ytsearch:${
				track.info.isrc
					? `\\"${track.info.isrc}"\\`
					: `${track.info.title} - ${track.info.author} audio`
			}`
		});

		const options = this.manager.nodes.find(x => x.connected)?.options;
		if (!options) throw new Error('No available nodes.');

		const { data }: { data: LavalinkResponse<LavalinkTrack> } = await axios.get(
			`http${options.secure ? 's' : ''}://${options.host}:${
				options.port
			}/loadtracks?${params.toString()}`,
			{
				headers: {
					Authorization: options.password || 'youshallnotpass'
				}
			}
		);

		if (!data.tracks.length) {
			const ns = new URLSearchParams({
				identifier: `ytsearch:${track.info.title} ${track.info.author} audio`
			});

			const { data }: { data: LavalinkResponse<LavalinkTrack> } = await axios.get(
				`http${options.secure ? 's' : ''}://${options.host}:${
					options.port
				}/loadtracks?${ns.toString()}`,
				{
					headers: {
						Authorization: options.password || 'youshallnotpass'
					}
				}
			);

			return data.tracks[0];
		}

		let lavatrack = data.tracks[0]!;

		if (lavatrack) {
			lavatrack.info = {
				...lavatrack.info,
				title: track.info.title || lavatrack.info.title,
				author: track.info.author || lavatrack.info.author,
				uri: track.info.uri || lavatrack.info.uri,
				thumbnail:
					track.info.thumbnail ||
					lavatrack.info.thumbnail ||
					'https://upload.wikimedia.org/wikipedia/commons/3/3c/No-album-art.png',
				length: lavatrack.info.length || track.info.length
			};
		}

		return Object.freeze(lavatrack);
	}

	public static filterNullOrUndefined(value: unknown): value is unknown {
		return typeof value !== 'undefined' ? value !== null : typeof value !== 'undefined';
	}
}

export interface ErelasfyOptions {
	/** Spotify application ID */
	clientId: string;
	/** Spotify application secret */
	clientSecret: string;
	/** Amount of pages to load, each page having 100 tracks. */
	playlistLimit?: number;
	/** Amount of pages to load, each page having 50 tracks. */
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

export type DeepUnpartial<T> = {
	[P in keyof T]-?: T[P] extends Record<string, unknown> ? DeepUnpartial<T[P]> : T[P];
};

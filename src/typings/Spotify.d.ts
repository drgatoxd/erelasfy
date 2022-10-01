export interface SpotifyTokenResponse {
	access_token: string | null;
	expires_in: number | null;
}

interface SpotifyArts {
	height: number;
	url: string;
	width: number;
}

export interface SpotifyAlbum extends SpotifyPartialAlbum {
	copyrights: Array<{
		text: string;
		type: string;
	}>;
	genres: string[];
	label: string;
	tracks: {
		href: string;
		items: SpotifyPartialTrack[];
		limit: number;
		next: null | string;
		offset: number;
		previous: null | string;
		total: number;
	};
}

export interface SpotifyPartialAlbum {
	album_type: string;
	artists: Artist[];
	available_markets: string[];
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	images: SpotifyArts[];
	name: string;
	release_date: string;
	release_date_precision: string;
	total_tracks: number;
	type: string;
	uri: string;
}

export interface SpotifyPartialTrack {
	artists: Artist[];
	available_markets: string[];
	disc_number: number;
	duration_ms: number;
	explicit: boolean;
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	is_local?: boolean;
	name: string;
	preview_url: string;
	track_number: number;
	type: string;
	uri: string;
}

export interface SpotifyTrack extends SpotifyPartialTrack {
	album: SpotifyPartialAlbum;
	external_ids: {
		isrc: string;
	};
	popularity: number;
}

export interface Artist {
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	name: string;
	type: string;
	uri: string;
}

export interface SpotifyAlbumTracks {
	items: SpotifyPartialTrack[];
	next: string | null;
}

export interface SpotifyPlaylistTracks {
	items: Array<{ track: SpotifyTrack }>;
	next: string | null;
	previous: string | null;
}

export interface SpotifyPlaylist {
	name: string;
	tracks: SpotifyPlaylistTracks;
	images: SpotifyArts[];
}

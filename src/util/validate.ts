import type { ErelasfyOptions } from '../spotify';

export function validateOptions(options: ErelasfyOptions) {
	/** Client ID validation */
	if (!options.clientId) throw new Error('Missing Spotify client ID');
	if (typeof options.clientId != 'string') throw new TypeError('options.clientId must be a string');

	/** Client ID validation */
	if (!options.clientSecret) throw new Error('Missing Spotify client secret');
	if (typeof options.clientSecret != 'string')
		throw new TypeError('options.clientSecret must be a string');

	/** PlaylistLimit validation */
	if (options.playlistLimit) {
		if (
			isNaN(options.playlistLimit) ||
			options.playlistLimit < 1 ||
			!Number.isInteger(options.playlistLimit)
		)
			throw new TypeError('options.playlistLimit must be a valid integer');
	}

	/** AlbumLimit validation */
	if (options.albumLimit) {
		if (
			isNaN(options.albumLimit) ||
			options.albumLimit < 1 ||
			!Number.isInteger(options.albumLimit)
		)
			throw new TypeError('options.albumLimit must be a valid integer');
	}

	return true;
}

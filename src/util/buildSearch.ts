import type { LoadType, PlaylistInfo, SearchResult, Track } from '@drgatoxd/erelajs';

export const buildSearch = (
	loadType: LoadType,
	tracks: Track[] | null,
	error: string | null,
	name: string | null,
	thumbnail?: string
): SearchResult => ({
	loadType: loadType,
	tracks: tracks ?? [],
	playlist: name
		? ({
				name,
				duration: (tracks || []).reduce((acc: number, cur: Track) => acc + (cur.duration || 0), 0),
				thumbnail
		  } as PlaylistInfo)
		: undefined,
	exception: error
		? {
				message: error,
				severity: 'COMMON'
		  }
		: undefined
});

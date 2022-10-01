# erelasfy 🎧

A simple plugin for [erela.js](https://npmjs.com/erela.js) package to play Spotify music **and retrieve Spotify metadata to the track(s)**.

## Installation

```bash
# for erela.js original
npm i erelasfy@original

# for @drgatoxd/erelajs fork
npm i erelasfy@latest
```

## Usage (typescript)

```ts
import { Manager } from 'erela.js';
// import { Manager } from '@drgatoxd/erelajs';
import { Erelasfy } from 'erelasfy';

const manager = new Manager({
	nodes: [
		{
			host: 'lava.drgato.me', // just an example
			port: 2333,
			password: 'youshallnotpass'
		}
	],
	plugins: [
		// you need an spotify client id and client secret
		// you can get it here: https://developer.spotify.com/dashboard/
		new Erelasfy({
			clientId: 'your spotify client id',
			clientSecret: 'your spotify client secret'
		})
	]
});

manager.search('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC');
```

- Discord: https://discord.gg/Z4wj6gYyvE
- Github: https://github.com/drgatoxd

import { Component } from '@angular/core';
import * as WebTorrent from 'webtorrent/webtorrent.min.js';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {
  constructor() {
    const client: WebTorrent.Instance = new WebTorrent();
    client.add(
      'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent',
      torrent => {
        console.log('Yo');
        console.log('Client is downloading:', torrent.infoHash);
        torrent.on('error', console.error);
        torrent.on('infoHash', console.log);
        torrent.on('metadata', console.log);
        torrent.on('noPeers', console.log);
        torrent.on('download', speed => console.log('speed', speed));
        torrent.on('done', a => console.log('done', a));
        // Torrents can contain many files. Let's use the .mp4 file
        const file = torrent.files.find(fl => fl.name.endsWith('.mp4'));

        // Display the file by adding it to the DOM.
        // Supports video, audio, image files, and more!
        file.appendTo('body');
      }
    );
  }
}

import { Component } from '@angular/core';
import { LibgenService } from '../libgen.service';
import { ILibGenBook } from '../models/libgen';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    query: string;
    options = {
        mirror: 'https://cors-anywhere.herokuapp.com/http://gen.lib.rus.ec',
        query: '',
        count: 5,
        sort_by: 'year',
        reverse: true,
    };
    searchResults: ILibGenBook[];
    constructor(
        private libgenService: LibgenService,
        private http: HttpClient
    ) {
        libgenService.getFastestMirror().then(console.log).catch(console.error);
    }

    async search() {
        this.options.query = this.query;
        try {
            const data = await this.libgenService.search(this.options);
            console.log(`${data.length} results for "${this.options.query}"`);
            this.searchResults = data;
        } catch (err) {
            console.error(err);
        }
    }
}

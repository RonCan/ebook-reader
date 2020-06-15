import { Injectable } from '@angular/core';
import { default as axios } from 'axios';
import { ILibGenBook, ISearchOptions } from './models/libgen';
const ID_REGEX = /ID:[^0-9]+[0-9]+[^0-9]/g;
const RESULT_REGEX = /[0-9]+ files found/i;
@Injectable({
    providedIn: 'root',
})
export class LibgenService {
    mirrors = [
        {
            baseUrl:
                'https://cors-anywhere.herokuapp.com/http://gen.lib.rus.ec',
            canDownloadDirect: false,
        },
        {
            baseUrl: 'https://cors-anywhere.herokuapp.com/http://libgen.is',
            // if true, '/get.php?md5=' works
            canDownloadDirect: true,
        },
    ];
    constructor() {}

    private extractIds(html) {
        const ids = [];
        const idsResults = html.match(ID_REGEX);
        let n = idsResults.length;
        while (n--) {
            const id = idsResults[n].replace(/[^0-9]/g, '');

            if (!parseInt(id, 10)) {
                return false;
            }

            ids.push(id);
        }
        return ids;
    }

    private async idFetch(options) {
        if (!options.mirror) {
            return new Error('No mirror provided to search function');
        } else if (!options.query) {
            return new Error('No search query given');
        } else if (options.query.length < 4) {
            return new Error('Search query must be at least four characters');
        }

        if (!options.count || !parseInt(options.count, 10)) {
            options.count = 10;
        }

        // sort_by options: "def", "title", "publisher", "year", "pages",
        // "language", "filesize", "extension" (must be lowercase)
        const sort = options.sort_by || 'def';

        // search_in options: "def", "title", "author", "series",
        // "periodical", "publisher", "year", "identifier", "md5",
        // "extension"
        const column = options.search_in || 'def';

        // boolean
        const sortmode = options.reverse ? 'DESC' : 'ASC';

        const query =
            options.mirror +
            '/search.php?&req=' +
            encodeURIComponent(options.query) +
            // important that view=detailed so we can get the real IDs
            '&view=detailed' +
            '&column=' +
            column +
            '&sort=' +
            sort +
            '&sortmode=' +
            sortmode +
            '&page=1';

        try {
            const response = await axios.get(query);
            let results = response.data.match(RESULT_REGEX);
            if (results === null) {
                return new Error(
                    'Bad response: could not parse search results'
                );
            } else {
                results = results[0];
            }

            results = parseInt(results.replace(/^([0-9]*).*/, '$1'), 10);

            if (results === 0) {
                return new Error(`No results for "${options.query}"`);
            } else if (!results) {
                return new Error('Could not determine # of search results');
            }

            let searchIds = this.extractIds(response.data);
            if (!searchIds) {
                return new Error('Failed to parse search results for IDs');
            }

            do {
                const query =
                    options.mirror +
                    '/search.php?&req=' +
                    encodeURIComponent(options.query) +
                    // important that view=detailed so we can get the real IDs
                    '&view=detailed' +
                    '&column=' +
                    column +
                    '&sort=' +
                    sort +
                    '&sortmode=' +
                    sortmode +
                    '&page=' +
                    // parentheses around the whole ensures the plus sign is
                    // interpreted as addition and not string concatenation
                    (Math.floor(searchIds.length / 25) + 1);

                try {
                    const page = await axios.get(query);

                    const newIds = this.extractIds(page.data);
                    if (!newIds) {
                        return new Error(
                            'Failed to parse search results for IDs'
                        );
                    } else {
                        searchIds = searchIds.concat(newIds);
                    }
                } catch (err) {
                    return err;
                }
                // repeat search if the number of records requested is more than we get on
                // the first query
            } while (searchIds.length < options.count);

            return searchIds;
        } catch (err) {
            return err;
        }
    }
    async search(options: ISearchOptions): Promise<ILibGenBook[]> {
        try {
            let ids = await this.idFetch(options);

            if (ids.length > options.count) {
                ids = ids.slice(0, options.count);
            }

            const url = `${options.mirror}/json.php?ids=${ids.join(
                ','
            )}&fields=*`;

            try {
                const response = await axios.get(url);
                return response.data;
            } catch (err) {
                return err;
            }
        } catch (err) {
            return err;
        }
    }

    async timeConnection(url) {
        const start = Date.now();

        try {
            await axios.head(url);

            const results = {
                url,
                time: Date.now() - start,
            };
            return results;
        } catch (err) {
            // async.map will fail if any of the timeConnections returns an error, but
            // we only care that at least one succeeds; so fail silently
            console.error(err);
        }
        return false;
    }

    // @param {Array} urls Can be an array of request objects or URL strings
    // @param {Function] callback
    async faster(urls) {
        const speedTests = urls.map(async (value, index, array) => {
            return await this.timeConnection(value);
        });
        const results = await Promise.all(speedTests);

        const noResponses = results.every((value) => {
            return !value;
        });

        if (noResponses) {
            return new Error('Bad response from all mirrors');
        }

        const sorted: any[] = results.sort((a: any, b: any) => {
            return a.time - b.time;
        });

        return sorted[0].url;
    }

    async getFastestMirror() {
        const urls = this.mirrors.map((value) => {
            return `${value.baseUrl}/json.php?ids=1&fields=*`;
        });

        try {
            const fastest = await this.faster(urls);
            return this.mirrors.filter((value) => {
                return fastest.indexOf(value.baseUrl) === 0;
            })[0].baseUrl;
        } catch (err) {
            return err;
        }
    }

    // @param {String, JSON} text
    // @param {Function} callback
    async canDownload(text) {
        const md5 = text.md5 ? text.md5.toLowerCase() : text.toLowerCase();

        const urls = this.mirrors
            .filter((value) => {
                return value.canDownloadDirect;
            })
            .map((value) => {
                return `${value.baseUrl}/get.php?md5=${md5}`;
            });

        try {
            return await this.faster(urls);
        } catch (err) {
            return err;
        }
    }
}

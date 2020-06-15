import { Component, OnInit } from '@angular/core';
import { Book, Rendition } from 'epubjs';

@Component({
    selector: 'app-book',
    templateUrl: './book.page.html',
    styleUrls: ['./book.page.scss'],
})
export class BookPage implements OnInit {
    book: Book;
    rendition: Rendition;
    constructor() {}

    ngOnInit() {
        this.book = new Book('assets/book.epub');
        this.rendition = this.book.renderTo('area', {
            width: '100%',
            height: window.innerHeight - 56,
        });
        this.rendition.spread('always', 600);
        const displayed = this.rendition.display();
        this.rendition.on('keyup', (event) => {
            const kc = event.keyCode || event.which;
            console.log(kc);
            if (kc === 37) {
                this.rendition.prev();
            }
            if (kc === 39) {
                this.rendition.next();
            }
        });
    }

    next() {
        this.rendition.next();
    }
}

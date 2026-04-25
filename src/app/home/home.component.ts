import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  galleries = [
    {
      title: 'Photography & Visuals',
      photos: [
        'https://imgur.com/fc3mYxP.jpg',
        'https://imgur.com/wBKAkPZ.jpg',
        'https://imgur.com/ra3wS0Z.jpg',
        'https://imgur.com/l9bGiOX.jpg',
        'https://imgur.com/8OS5Dwg.jpg',
        'https://imgur.com/Xr7Mzav.jpg',
        'https://imgur.com/0q7H1zB.jpg',
        'https://imgur.com/P38eyA7.jpg',
        'https://imgur.com/dtq9fya.jpg',
        'https://imgur.com/wfop4XG.jpg',
        'https://imgur.com/ZqMkeiK.jpg',
        'https://imgur.com/biAXpSX.jpg',
        'https://imgur.com/TzG4Eww.jpg',
        'https://imgur.com/qCSvfUK.jpg'
      ]
    }
  ];

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
          }
        });
      }, observerOptions);

      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach(el => observer.observe(el));
    }
  }
}

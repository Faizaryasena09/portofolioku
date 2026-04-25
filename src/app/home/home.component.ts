import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
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
}

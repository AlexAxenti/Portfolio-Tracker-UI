import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicHeader } from '../public-header/public-header';

@Component({
  selector: 'app-public-shell',
  imports: [PublicHeader, RouterOutlet],
  templateUrl: './public-shell.html',
  styleUrl: './public-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShell {}

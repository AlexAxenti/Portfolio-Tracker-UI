import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';

@Component({
  selector: 'app-dashboard-shell',
  imports: [Header, RouterOutlet],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardShell {}

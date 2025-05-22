import { Component, OnInit } from '@angular/core';
import { KaitenService, Board, Card, Column } from '../../services/kaiten.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskCardComponent } from '../task-card/task-card.component';
import * as XLSX from 'xlsx';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TaskCardComponent,
    InputTextModule,
    ToastModule,
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  boards: Board[] = [];
  boardCards: { [key: number]: Card[] } = {};
  loading: boolean = false;
  error: string = '';
  spaceId: number = 569884;
  username: string = 'ivalera_dev';
  totalHours: { [key: string]: number } = {
    done: 0,
    inProgress: 0,
    estimated: 0
  };
  private readonly COLUMN_IDS = {
    DONE: 4714326,
    IN_PROGRESS: 4530950,
    ESTIMATED: 4643627
  };
  private readonly STORAGE_KEYS = {
    SPACE_ID: 'lastSpaceId',
    USERNAME: 'lastUsername'
  };
  isAscending: boolean = true;

  constructor(
    private kaitenService: KaitenService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadLastUsedValues();
    if (this.spaceId && this.username) {
      this.loadBoards();
    }
  }

  private loadLastUsedValues(): void {
    const savedSpaceId = localStorage.getItem(this.STORAGE_KEYS.SPACE_ID);
    const savedUsername = localStorage.getItem(this.STORAGE_KEYS.USERNAME);

    if (savedSpaceId) {
      this.spaceId = parseInt(savedSpaceId, 10);
    }
    if (savedUsername) {
      this.username = savedUsername;
    }
  }

  private saveLastUsedValues(): void {
    localStorage.setItem(this.STORAGE_KEYS.SPACE_ID, this.spaceId.toString());
    localStorage.setItem(this.STORAGE_KEYS.USERNAME, this.username);
  }

  getSortedColumns(columns: Column[]): Column[] {
    return [...columns].sort((a, b) => a.sort_order - b.sort_order);
  }

  getColumnCards(boardId: number, columnId: number): Card[] {
    const cards = this.boardCards[boardId]?.filter(card => card.column_id === columnId) || [];
    return cards.sort((a, b) => this.isAscending ? a.sort_order - b.sort_order : b.sort_order - a.sort_order);
  }

  toggleSortOrder(): void {
    this.isAscending = !this.isAscending;
  }

  exportToExcel(): void {
    const doneCards: { title: string; hours: string }[] = [];
    
    this.boards.forEach(board => {
      const cards = this.getColumnCards(board.id, this.COLUMN_IDS.DONE);
      cards.forEach(card => {
        doneCards.push({
          title: card.title,
          hours: card.properties?.id_411710 || '0h'
        });
      });
    });

    if (doneCards.length === 0) {
      this.error = 'Нет задач для экспорта';
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(doneCards);
    const workbook: XLSX.WorkBook = { Sheets: { 'Задачи': worksheet }, SheetNames: ['Задачи'] };
    
    // Генерируем имя файла с текущей датой
    const fileName = `tasks_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Сохраняем файл
    XLSX.writeFile(workbook, fileName);
  }

  calculateTotalHours(): void {
    this.totalHours = {
      done: 0,
      inProgress: 0,
      estimated: 0
    };

    this.boards.forEach(board => {
      // Подсчет часов для колонки "Готово"
      const doneCards = this.getColumnCards(board.id, this.COLUMN_IDS.DONE);
      doneCards.forEach(card => {
        if (card.properties?.id_411710) {
          const hours = parseFloat(card.properties.id_411710.replace('h', ''));
          if (!isNaN(hours)) {
            this.totalHours['done'] += hours;
          }
        }
      });

      // Подсчет часов для колонки "В работе"
      const inProgressCards = this.getColumnCards(board.id, this.COLUMN_IDS.IN_PROGRESS);
      inProgressCards.forEach(card => {
        if (card.properties?.id_411710) {
          const hours = parseFloat(card.properties.id_411710.replace('h', ''));
          if (!isNaN(hours)) {
            this.totalHours['inProgress'] += hours;
          }
        }
      });

      // Подсчет часов для колонки "Оценка задач"
      const estimatedCards = this.getColumnCards(board.id, this.COLUMN_IDS.ESTIMATED);
      estimatedCards.forEach(card => {
        if (card.properties?.id_411710) {
          const hours = parseFloat(card.properties.id_411710.replace('h', ''));
          if (!isNaN(hours)) {
            this.totalHours['estimated'] += hours;
          }
        }
      });
    });
  }

  loadBoards() {
    if (!this.spaceId || !this.username) {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Пожалуйста, введите ID пространства и имя пользователя'
      });
      return;
    }

    this.loading = true;
    this.error = '';
    this.boards = [];
    this.boardCards = {};

    this.kaitenService.getBoards(this.spaceId).subscribe({
      next: (boards) => {
        this.boards = boards;
        // Загружаем задачи для каждой доски
        boards.forEach(board => {
          this.loadBoardCards(board.id);
        });
        this.loading = false;
        this.saveLastUsedValues();
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message;
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка загрузки',
          detail: error.message
        });
      }
    });
  }

  loadBoardCards(boardId: number) {
    this.kaitenService.getBoardCards(this.spaceId, boardId, this.username).subscribe({
      next: (cards) => {
        this.boardCards[boardId] = cards;
        this.calculateTotalHours(); // Пересчитываем часы после загрузки карточек
      },
      error: (err) => {
        console.error(`Error loading cards for board ${boardId}:`, err);
        this.boardCards[boardId] = [];
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 
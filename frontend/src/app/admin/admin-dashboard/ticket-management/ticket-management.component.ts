import { Component,  OnInit, ViewChild } from "@angular/core"
import  { FormBuilder, FormGroup } from "@angular/forms"
import { MatTableDataSource } from "@angular/material/table"
import { MatPaginator } from "@angular/material/paginator"
import { MatSort } from "@angular/material/sort"
import  { MatDialog } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { Router } from "@angular/router"
import  { TicketService } from "../../../core/services/ticket.service"
import  { Ticket, TicketFilter, TicketStats } from "../../../core/models/ticket.model"
import { ToastService } from "../../../core/services/toast.service"

@Component({
  selector: 'app-ticket-management',
  standalone: false,
  templateUrl: './ticket-management.component.html',
  styleUrl: './ticket-management.component.css'
})
export class TicketManagementComponent implements OnInit {
  displayedColumns: string[] = [
  "id",
  "subject",
  "userName",  // User name column
  "userEmail", // User email column
  "category",
  "priority",
  "status",
  "createdAt",
  "actions",
];


  dataSource = new MatTableDataSource<Ticket>([])
  filterForm: FormGroup
  loading = false
  error = ""
  stats: TicketStats = {
    total: 0,
    recent: 0,
    byStatus: {},
    byPriority: {},
  }

  totalTickets = 0
  currentPage = 1
  pageSize = 10

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  constructor(
    private ticketService: TicketService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private toast: ToastService
  ) {
    this.filterForm = this.formBuilder.group({
      search: [""],
      status: [""],
      priority: [""],
      category: [""],
    })
  }

  ngOnInit(): void {
    this.loadTickets()
    this.loadStats()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  loadTickets(): void {
    this.loading = true
    this.error = ""

    const filter: TicketFilter = {
      search: this.filterForm.get("search")?.value,
      status: this.filterForm.get("status")?.value,
      priority: this.filterForm.get("priority")?.value,
      category: this.filterForm.get("category")?.value,
      page: this.currentPage,
      limit: this.pageSize,
    }

    this.ticketService.getAllTickets(filter).subscribe({
      next: (response) => {
        this.dataSource.data = response.tickets
        this.totalTickets = response.pagination.total
        this.loading = false
      },
      error: (error) => {
        this.error = "Failed to load tickets. Please try again."
        this.loading = false
        console.error("Error loading tickets:", error)
      },
    })
  }

  loadStats(): void {
    this.ticketService.getTicketStats().subscribe({
      next: (stats) => {
        this.stats = stats
      },
      error: (error) => {
        console.error("Error loading stats:", error)
      },
    })
  }

  applyFilter(): void {
    this.currentPage = 1
    this.loadTickets()
  }

  resetFilter(): void {
    this.filterForm.reset({
      search: "",
      status: "",
      priority: "",
      category: "",
    })
    this.currentPage = 1
    this.loadTickets()
  }

  viewTicketDetails(ticket: Ticket): void {
    this.router.navigate(["/admin/tickets", ticket.id])
  }

  formatDate(date: Date | string): string {
  if (!date) return 'N/A';

  const d = new Date(date);
  return isNaN(d.getTime())
    ? 'Invalid Date'
    : d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });}

  getStatusClass(status: string): string {
    switch (status) {
      case "open":
        return "status-open"
      case "in_progress":
        return "status-in-progress"
      case "resolved":
        return "status-resolved"
      case "closed":
        return "status-closed"
      default:
        return ""
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case "urgent":
        return "priority-urgent"
      case "high":
        return "priority-high"
      case "medium":
        return "priority-medium"
      case "low":
        return "priority-low"
      default:
        return ""
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case "payment":
        return "payment"
      case "technical":
        return "build"
      case "membership":
        return "card_membership"
      case "events":
        return "event"
      case "general":
        return "help_outline"
      default:
        return "help_outline"
    }
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1
    this.pageSize = event.pageSize
    this.loadTickets()
  }
  markAsSolved(ticket: Ticket): void {
      if (confirm(`Mark ticket #${ticket.id} as resolved?`)) {
        this.ticketService.updateTicket(ticket.id.toString(), { status: 'resolved' }).subscribe({
          next: () => this.loadTickets(), // Reload the table
          error: (err) => console.error('Failed to resolve ticket', err),
        });
      }
    }

    deleteTicket(ticket: Ticket): void {
      if (confirm(`Are you sure you want to delete ticket #${ticket.id}?`)) {
        this.ticketService.deleteTicket(ticket.id).subscribe({
          next: () => this.loadTickets(), // Refresh the data
          error: (err) => console.error('Failed to delete ticket', err),
        });
      }
    }
    

}


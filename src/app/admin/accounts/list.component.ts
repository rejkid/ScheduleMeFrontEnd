import { ViewportScroller } from '@angular/common';
import { signal, Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { pipe } from 'rxjs';
import { first } from 'rxjs/operators';
import { Account, Role } from 'src/app/_models';
import { AccountService, AlertService } from 'src/app/_services';

const COLUMNS_SCHEMA = [
    {
        key: "name",
        type: "text",
        label: "Name"
    },
    {
        key: "email",
        type: "text",
        label: "Email"
    },
    {
        key: "dob",
        type: "text",
        label: "DOB"
    },
    {
        key: "role",
        type: "text",
        label: "Role"
    },
    {
        key: "action",
        type: "text",
        label: "Action"
    },
]

@Component({
    templateUrl: 'list.component.html',
    styleUrls: ['./list.component.less'],
})
export class ListComponent implements OnInit, AfterViewInit {
    @ViewChild('paginator') paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    dataSource: MatTableDataSource<Account>;
    displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
    columnsSchema: any = COLUMNS_SCHEMA;

    accounts = signal<Account[]>([]);
    autoEmail: Boolean;
    isDeleting: boolean = false;

    static pageSize: number;
    static pageIndex: number;

    generatingSchedules: boolean = false;
    uploadProgress: number = 0;
    downloadingSchedules: boolean = false;

    constructor(private accountService: AccountService,
        private alertService: AlertService,
        private scroller: ViewportScroller,
        private router: Router) {

    }
    ngOnInit() {
    }
    ngAfterViewInit(): void {
        setTimeout(() => {
            this.dataSource = new MatTableDataSource();
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
    
            this.refreshList();
           }, 0);
    }

    onRowSelected(contact: Account, input: any, index: number, event: MouseEvent) {
        if (event.ctrlKey) {
            if (contact.highlighted) {
                contact.highlighted = false;
                return;
            }
        }
        this.selectRow(contact, index);
    }
    private sortInAscNameOrder() {
        const sortState: Sort = { active: 'name', direction: 'asc' };
        this.sort.active = sortState.active;
        this.sort.direction = sortState.direction;
        this.sort.sortChange.emit(sortState);
    }
    private selectRow(contact: Account, index: number) {
        for (let index = 0; index < this.accounts().length; index++) {
            const element = this.accounts()[index];
            if (element.highlighted)
                element.highlighted = false;

            if (this.isSameAccount(contact, element)) {
                var pageNumber = Math.floor(index / this.paginator.pageSize);
                this.paginator.pageIndex = pageNumber;

                this.paginator.page.next({
                    pageIndex: pageNumber,
                    pageSize: this.paginator.pageSize,
                    length: this.paginator.length
                } as PageEvent);
            }
        }
        contact.highlighted = true;
    }
    isSameAccount(a1: Account, a2: any): boolean {
        console.assert(a1 != null && a2 != null, "One of the accounts is null");
        return a1.email == a2.email && a1.dob == a2.dob;
    }

    /* I am not sure if we need 'input' parameter - keep it for now*/
    applyFilter(t: any, input: any) {
        const target = t as HTMLTextAreaElement;
        var filterValue = target.value;
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }
    private refreshList() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(accounts => {
                this.accounts.set(accounts);
                this.dataSource.data = this.accounts();
                this.paginator.pageIndex = ListComponent.pageIndex;
                this.paginator.pageSize = ListComponent.pageSize;
    
                // Initial sort by 'name' is asc order
                this.sortInAscNameOrder();

            });
        this.accountService.getAutoEmail()
            .pipe(first())
            .subscribe((autoEmail: any) => {
                this.autoEmail = autoEmail;
            });
    }

    deleteAccount(id: string) {
        const account = this.accounts().find(x => x.id === id);
        account.isDeleting = true;
        this.accountService.delete(id)
            .pipe(first())
            .subscribe(() => {
                this.refreshList();
            });
    }
    public get RoleAdminEnum() {
        return Role.Admin;
    }
    public onDeleteAllUserAccounts(event: Event) {
        this.isDeleting = true;
        this.accountService.deleteAllUserAccounts()
            .pipe(first())
            .subscribe({
                next: (accounts: any) => {
                    this.refreshList();
                    console.log(accounts);
                },
                complete: () => {
                    //this.alertService.info("Done");
                    this.isDeleting = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.scroller.scrollToAnchor("pageStart");
                    this.isDeleting = false;
                }
            });
    }
    public onChangeAutoEmail(event: any, tr: any) {
        this.accountService.setAutoEmail(new Boolean(event.target.checked))
            .pipe(first())
            .subscribe({
                next: (autoEmail: any) => {
                    //tr.click();
                    this.autoEmail = autoEmail;
                },
                complete: () => {
                    //this.alertService.info("Done");
                },
                error: error => {
                    this.alertService.error(error);
                    this.scroller.scrollToAnchor("pageStart");
                }

            });
    }
    public get Role() {
        return Role;
    }
    generateSchedules() {
        this.alertService.clear();
        this.generatingSchedules = true;
        this.accountService.generateSchedules()
            .pipe(first())
            .subscribe({
                next: (autoEmail: any) => {

                },
                complete: () => {
                    this.generatingSchedules = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.generatingSchedules = false;
                }

            });
    }
    downloadSchedules(event: any) {
        this.downloadingSchedules = true;

        this.accountService.downloadSchedulesFile().subscribe(
            {
                next: (data) => {
                    var file = new Blob([data], { type: 'application/pdf' })
                    var fileURL = URL.createObjectURL(file);

                    // if you want to open PDF in new tab
                    window.open(fileURL);
                    var a = document.createElement('a');
                    a.href = fileURL;
                    a.target = '_blank';
                    a.download = 'Schedules.pdf';
                    document.body.appendChild(a);
                    a.click();
                },
                complete: () => {
                    //this.router.navigate(['../'], { relativeTo: this.route });
                    this.downloadingSchedules = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.downloadingSchedules = false;
                }
            }
        );
    }
    onChangePageSettings(event: PageEvent ) {
        ListComponent.pageSize = event.pageSize;
        ListComponent.pageIndex = event.pageIndex;
    }

    sortData($event: Sort) {
        if ($event.active == this.displayedColumns[0]) {
            this.accounts().sort((a, b) => {
                if ($event.direction == 'asc' as SortDirection) {
                    return a.firstName.localeCompare(b.firstName);
                } else {
                    return b.firstName.localeCompare(a.firstName);
                }
            });
        } else if ($event.active == this.displayedColumns[1]) {
            this.accounts().sort((a, b) => {
                if ($event.direction == 'asc' as SortDirection) {
                    return Number(a.email) - Number(b.email);
                } else {
                    return Number(b.email) - Number(a.email);;
                }
            });
        }
    }
    get pageSize() {
        return ListComponent.pageSize;
    }
    get pageIndex() {
        return ListComponent.pageIndex;
    }
}



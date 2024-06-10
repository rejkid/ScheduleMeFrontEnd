import { ViewportScroller } from '@angular/common';
import { signal, Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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
    static HighlightRow: Number = -1;

    currentSelectedContact: Account = null;
    lastSelectedContact: Account = null;
    highlighted: boolean;

    uploading: boolean = false;
    uploadProgress: number = 0;
    downloadingSchedules: boolean = false;

    constructor(private accountService: AccountService,
        private alertService: AlertService,
        private scroller: ViewportScroller,
        private router: Router) {

    }
    ngAfterViewInit(): void {
        this.refreshList();
    }

    clickedRow(contact: Account, input: any, index: number, event: MouseEvent) {

        if (event.ctrlKey) {
            ListComponent.HighlightRow = ListComponent.HighlightRow == index ? -1 : index;
        } else {
            ListComponent.HighlightRow = index;//this.HighlightRow == index ? -1 : index;
        }

        contact.highlighted = !contact.highlighted;
        this.currentSelectedContact = contact;

        if (this.lastSelectedContact != null) {
            this.lastSelectedContact.highlighted = false;
        }
        this.lastSelectedContact = this.currentSelectedContact;

        if (!contact.highlighted) {
            // If row is deselected mark both contacts as deselected(null);
            this.lastSelectedContact = null;
            this.currentSelectedContact = null;
        }
        console.log("clickedRow: row == this.staticHighlightRow: " + (index == this.staticHighlightRow));
    }
    get staticHighlightRow() {
        return ListComponent.HighlightRow;
    }
    ngOnInit() {
        //this.refreshList();

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


                this.dataSource = new MatTableDataSource(this.accounts());
                this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;

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
    public onChangeHandler(event: any, tr: any) {
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
        this.uploading = true;
        this.accountService.generateSchedules()
            .pipe(first())
            .subscribe({
                next: (autoEmail: any) => {

                },
                complete: () => {
                    this.uploading = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.uploading = false;
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
                },
                error: error => {
                    this.alertService.error(error);
                    this.downloadingSchedules = false;
                }
            }
        );
    }
}



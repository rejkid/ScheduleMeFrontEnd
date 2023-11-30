import { AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AccountService, AlertService } from 'src/app/_services';

@Component({
  selector: 'app-upload-accounts',
  templateUrl: './upload-accounts.component.html',
  styleUrls: ['./upload-accounts.component.less']
})
export class UploadAccountsComponent implements OnInit, AfterViewInit {
  @ViewChildren("progressFile") progressChildren: QueryList<ElementRef>;
  @ViewChild("progressFile") progressChild: ElementRef;
  @Input() requiredFileType: string;

  fileName = '';
  uploadProgress: number = 0;
  uploadSub: Subscription;
  submitted = false;
  fileHasBeenSelected: boolean = false;

  accountService: AccountService;
  constructor(accountService: AccountService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2) {

    this.accountService = accountService;
  }
  ngAfterViewInit(): void {
    this.progressChildren.changes.subscribe((comps: QueryList <ElementRef>) =>
    {
      if(comps.first != undefined)
        comps.first.nativeElement.removeAttribute("value")
    });
  }
  ngOnInit(): void {
    this.fileName = "";
  }

  onFileSelected(event: Event) {
    const file: File = (event.target as HTMLInputElement).files[0];

    if (file) {
      this.fileHasBeenSelected = true;
      this.fileName = file.name;
    } else {
      this.fileHasBeenSelected = false;
    }
  }
  onSubmit(event: any, fileUpload: any) {

    const file: File = fileUpload.files[0];

    if (file) {
      this.submitted = true;
      this.fileName = file.name;
      const formData = new FormData();
      formData.append("file", file);

      if (file.type == "application/x-msdownload") {
        this.alertService.error("File must be an .xlsx file type");
        return;
      }

      const upload$ = this.accountService.uploadAccountsFile(formData)
        .pipe(
          finalize(() => {
            this.reset();
          })
        );

      this.uploadSub = upload$.subscribe({
        next: (value) => {
          //this.submitted = false;
          // if (value.type == HttpEventType.UploadProgress) {
          //   this.uploadProgress = Math.round(100 * (value.loaded / value.total));
          //   console.log("Progress:" + this.uploadProgress);
          //   if (this.uploadProgress == 100) {
          //     this.uploadProgress = 0;
          //     //this.progressChild.nativeElement.removeAttribute("value");
          //   }
          // }
        },
        complete: () => {
          this.alertService.info("Done");
          this.submitted = false;
          this.uploadProgress = -1;
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: error => {
          this.alertService.error(error);
          this.submitted = false;
        }
      });
    }
  }
  cancelUpload() {
    this.uploadSub.unsubscribe();
    this.reset();
  }

  reset() {
    this.uploadProgress = null;
    this.uploadSub = null;
  }
}

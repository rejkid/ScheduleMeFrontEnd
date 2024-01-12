import { AfterViewInit, Component, ElementRef, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AccountService, AlertService } from 'src/app/_services';
import { saveAs } from "file-saver";
import { HttpEvent, HttpEventType, HttpResponse, HttpProgressEvent } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-download-schedules-file',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
    ],
  templateUrl: './download-schedules-file.component.html',
  styleUrl: './download-schedules-file.component.less'
})
export class DownloadSchedulesFileComponent implements OnInit, AfterViewInit {
  @ViewChildren("progressFile") progressChildren: QueryList<ElementRef>;

  uploadSub: Subscription;
  fileName = '';
  downloadProgress = 0;
  imageSrc: SafeUrl;
  fileHasBeenSelected: boolean = false;
  submitted: boolean = false;

  constructor(private accountService: AccountService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2) {


  }
  ngAfterViewInit(): void {
    this.progressChildren.changes.subscribe((comps: QueryList<ElementRef>) => {
      if (comps.first != undefined)
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
  onSubmit(event: any) {
    this.submitted = true;

    const upload$ = this.accountService.downloadSchedulesFile()
      .pipe(
        finalize(() => {
          this.reset();
        })
      );

    this.uploadSub = upload$.subscribe(
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
          this.submitted = false;
        }
      }
    );

  }
  isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
    return event.type === HttpEventType.Response
  }

  isHttpProgressEvent(event: HttpEvent<unknown>): event is HttpProgressEvent {
    return event.type === HttpEventType.DownloadProgress
      || event.type === HttpEventType.UploadProgress
  }
  reset() {
    this.submitted = false;
    this.uploadSub = null;
  }
}

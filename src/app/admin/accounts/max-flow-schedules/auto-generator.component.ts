import { AfterViewInit, Component, ElementRef, OnInit, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AccountService, AlertService } from 'src/app/_services';

@Component({
  selector: 'app-auto-generator',
  templateUrl: './auto-generator.component.html',
  styleUrls: ['./auto-generator.component.less']
})
export class AutoGeneratorComponent implements OnInit, AfterViewInit{
  @ViewChildren("progressFile") progressChildren: QueryList<ElementRef>;
  
  private accountService: AccountService;
  private alertService: AlertService;
  private router: Router;
  private route: ActivatedRoute;
  private renderer: Renderer2;
fileName: any;
  fileHasBeenSelected: boolean = false;
  submitted: boolean;
  uploadSub: Subscription;
  uploadProgress: number = 0;

	constructor($accountService: AccountService, $alertService: AlertService, $router: Router, $route: ActivatedRoute) {
		this.accountService = $accountService;
		this.alertService = $alertService;
		this.router = $router;
		this.route = $route;
	}
  ngOnInit(): void {
    this.fileName = "";
  }
  ngAfterViewInit(): void {
    /* We need the code below because if ngIf directive in the template file  */
    this.progressChildren.changes.subscribe((comps: QueryList <ElementRef>) =>
    {
      if(comps.first != undefined)
        comps.first.nativeElement.removeAttribute("value")
    });
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
        this.alertService.error("File must be an .xlsm file type");
        return;
      }

      const upload$ = this.accountService.uploadTimeSlotsFile(formData)
        .pipe(
          finalize(() => {
            this.reset();
          })
        );

      this.uploadSub = upload$.subscribe({
        next: (value) => {
        },
        complete: () => {
          this.alertService.info("Done");
          this.submitted = false;
          this.uploadProgress = -1;
          //this.router.navigate(['../../'], { relativeTo: this.route });
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

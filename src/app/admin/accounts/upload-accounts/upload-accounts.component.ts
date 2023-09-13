import { HttpEventType } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { AccountService, AlertService } from 'src/app/_services';

@Component({
  selector: 'app-upload-accounts',
  templateUrl: './upload-accounts.component.html',
  styleUrls: ['./upload-accounts.component.less']
})
export class UploadAccountsComponent implements OnInit {
  @Input()
  requiredFileType: string;

  fileName = '';
  uploadProgress: number;
  uploadSub: Subscription;

  accountService: AccountService;
  constructor(accountService: AccountService,
    private alertService: AlertService) {

    this.accountService = accountService;
  }
  ngOnInit(): void {
    this.fileName = "";
  }
  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.fileName = file.name;
      const formData = new FormData();
      formData.append("thumbnail", file);

      if (file.type == "application/x-msdownload") {
        this.alertService.error("File must be an .xsl file type");
        return;
      }

      const upload$ = this.accountService.uploadAccountsFile(formData)// this.http.post("/api/thumbnail-upload", formData, {reportProgress: true, observe: 'events}
        .pipe(
          finalize(() => this.reset())
        );

      this.uploadSub = upload$.subscribe({
        next: (value) => {
          if (value.type == HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(100 * (value.loaded / value.total));
            console.log("Progress:" + this.uploadProgress);
          }
        },
        complete: () => {
          this.alertService.info("Done");
        },
        error: error => {
          this.alertService.error(error);
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

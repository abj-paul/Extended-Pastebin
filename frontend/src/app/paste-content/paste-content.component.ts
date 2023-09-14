import { Component } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ConstantService } from '../services/constant.service';

@Component({
  selector: 'app-paste-content',
  templateUrl: './paste-content.component.html',
  styleUrls: ['./paste-content.component.css']
})
export class PasteContentComponent {
  pasteId: string | null = null;
  pasteContent: string = '';

  constructor(private http : HttpClient, private constant : ConstantService){}

  createPaste() {
    this.http.post<any>(this.constant.getServerAddress()+"/api/paste", {
      "content" : this.pasteContent
    }).subscribe((response)=>{
      this.pasteId = response.id;
    });
  }

  reset() {
    this.pasteId = null;
    this.pasteContent = '';
  }
}

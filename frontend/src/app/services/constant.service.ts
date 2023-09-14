import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConstantService {

  private server_address: string = "http://localhost:3000";

  constructor() { }

  getServerAddress():string{
    return this.server_address;
  }
}

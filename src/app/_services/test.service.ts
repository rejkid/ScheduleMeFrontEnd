import { Inject, Injectable, InjectionToken } from '@angular/core';

export const COLOR_CONFIG_TOKEN = new InjectionToken<ColorConfig>('config');
export interface ColorConfig {
  apiUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class TestService {

  constructor() { }

  public getProductInfo(){   
    return `Please visit 
           
            for more information about our 
             product`;
 }
}

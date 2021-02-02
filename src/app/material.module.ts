import { NgModule } from '@angular/core';

import {MatExpansionModule} from '@angular/material/expansion';
import {MatSliderModule} from '@angular/material/slider';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';
import {MatRadioModule} from '@angular/material/radio';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';

@NgModule({
  exports: [
    MatExpansionModule,
    MatSliderModule,
    MatToolbarModule,
    MatButtonModule,
    MatTabsModule,
    MatRadioModule,
    MatInputModule,
    MatIconModule
  ]
})
export class MaterialModule {}

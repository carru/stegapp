import { NgModule } from '@angular/core';

import {MatExpansionModule} from '@angular/material/expansion';
import {MatSliderModule} from '@angular/material/slider';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';

@NgModule({
  exports: [
    MatExpansionModule,
    MatSliderModule,
    MatToolbarModule,
    MatButtonModule,
    MatTabsModule
  ]
})
export class MaterialModule {}

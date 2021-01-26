import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { EncodeComponent } from './encode/encode.component';
import { DecodeComponent } from './decode/decode.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'encode', component: EncodeComponent },
  { path: 'decode', component: DecodeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

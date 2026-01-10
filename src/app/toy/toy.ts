import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToyService } from '../../services/toy.service';
import { ToyModel } from '../../models/toy.model';
import { RouterLink } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UserService } from '../../services/user.service';
import { v4 as uuidv4 } from 'uuid';



@Component({
  selector: 'app-toy',
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './toy.html',
  styleUrl: './toy.css'
})
export class Toy {
  protected toy = signal<ToyModel | null>(null)

  quantity = 1;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.params.subscribe(p => {
      const permalink = p['permalink'];
      if (permalink) {
        ToyService.getToyByPermaLink(permalink)
          .then(rsp => this.toy.set(rsp.data));
      }
    });
  }

  protected onSubmit() {
    UserService.createOrder({
      toyId: this.toy()!.toyId,
      name: this.toy()!.name,
      productionDate: this.toy()!.productionDate,
      quantity: this.quantity,
      status: 'na',
      price: this.toy()!.price,
      orderId: uuidv4()
    })

    this.router.navigateByUrl('/profile')
  }

}

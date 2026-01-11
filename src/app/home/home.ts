import { Component, signal, computed } from '@angular/core';
import { ToyService } from '../../services/toy.service';
import { ToyModel } from '../../models/toy.model';
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { UserService } from '../../services/user.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  protected toy = signal<ToyModel | null>(null)
  protected allToys = signal<ToyModel[]>([]);
  protected search = signal('');
  quantity = 1;


  protected toys = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.allToys();

    return this.allToys().filter(t =>
      (t.name + ' ' + t.description + ' ' + t.permalink)
        .toLowerCase()
        .includes(q)
    );
  });

  constructor(private router: Router) {
    this.loadAllToys();
  }

  protected loadAllToys() {
    ToyService.getToys()
      .then(rsp => this.allToys.set(rsp.data))
      .catch(err => console.log("API error:", err));
  }

  protected onSearchChange(v: string) {
    this.search.set(v);
  }

  protected addToCart(toy: ToyModel) {
    UserService.createOrder({
      toyId: toy.toyId,
      name: toy.name,
      productionDate: toy.productionDate,
      quantity: 1,         
      status: 'na',
      price: toy.price,
      orderId: uuidv4()
    });

    this.router.navigateByUrl('/profile');
  }

}

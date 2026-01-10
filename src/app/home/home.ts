import { Component, signal, computed } from '@angular/core';
import { ToyService } from '../../services/toy.service';
import { ToyModel } from '../../models/toy.model';
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  protected allToys = signal<ToyModel[]>([]);
  protected search = signal('');

  protected toys = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.allToys();

    return this.allToys().filter(t =>
      (t.name + ' ' + t.description + ' ' + t.permalink)
        .toLowerCase()
        .includes(q)
    );
  });

  constructor() {
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
}

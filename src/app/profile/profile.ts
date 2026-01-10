import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../model/user.model';
import { computed } from '@angular/core';


@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {

  protected activeUser = signal<UserModel | null>(null);
  protected statusMap = {
    'na':'Waiting',
    'paid':'Paid',
    'canceled':'Canceled',
    'liked':'Positive Rating',
    'disliked':'Negative Rating'
  }

  constructor(private router: Router) {
    if (!UserService.hasAuth()) {
      localStorage.setItem(UserService.T0_KEY, `/profile`);
      this.router.navigateByUrl('/login');
      return;
    }

    this.activeUser.set(UserService.getActiveUser());
  }
  totalPrice = computed(() => {
    const orders = this.activeUser()?.data ?? [];

    return orders.reduce((sum, order) => {
      return sum + (order.price * order.quantity);
    }, 0);
  });
}


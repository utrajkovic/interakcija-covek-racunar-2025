import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserService } from '../services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected year = new Date().getFullYear()

  constructor(private router: Router) {}

  getUserName() {
    const user = UserService.getActiveUser()
    return `${user.firstName} ${user.lastName}`
  }

  hasAuth() {
    return UserService.hasAuth()
  }

  doLogout() {
    Swal.fire({
      title: "Are you sure you want to logout?",
      showCancelButton: true,
      confirmButtonText: "Logout Now",
      cancelButtonText: `Don't Logout`
    }).then((result) => {
      if (result.isConfirmed) {
        UserService.logout()
        this.router.navigateByUrl('/login')
      }
    })
  }
}

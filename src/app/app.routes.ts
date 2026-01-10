import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Toy } from './toy/toy';
import { Profile } from './profile/profile';

export const routes: Routes = [
    { path: '', component: Home, title: 'Home' },
    { path: 'about', component: About, title: 'About' },
    { path: 'login', component: Login, title: 'Login' },
    { path: 'signup', component: Signup, title: 'Signup' },
    { path: 'toy/:permalink', component: Toy, title: 'Toy' },
    { path: 'profile', component: Profile, title: 'User Profile' },
    { path: '**', redirectTo: '' }
];

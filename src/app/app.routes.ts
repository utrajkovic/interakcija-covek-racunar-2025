import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Details } from './details/details';
import { Login } from './login/login';
import { Signup } from './signup/signup';

export const routes: Routes = [
    {path: '', component: Home, title: 'Home'},
    {path: 'about', component: About, title: 'About'},
    {path: 'login', component: Login, title: 'Login'},
    {path: 'signup', component: Signup, title: 'Signup'},
    {path: 'details/:id', component: Details, title: 'Details'},
    {path: '**', redirectTo: ''}
];

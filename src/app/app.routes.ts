import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Details } from './details/details';
import { Login } from './login/login';
import { Signup } from './signup/signup';

export const routes: Routes = [
    {path: '', component: Home},
    {path: 'about', component: About},
    {path: 'login', component: Login},
    {path: 'signup', component: Signup},
    {path: 'details/:id', component: Details},
    {path: '**', redirectTo: ''}
];

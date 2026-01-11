import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserService } from '../services/user.service';
import { Utils } from './utils';
import { MessageModel } from '../models/message.model';
import { RasaService } from '../services/rasa.service';
import { FormsModule } from '@angular/forms';
import { ToyService } from '../services/toy.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected year = new Date().getFullYear()
  protected waitingForResponse: boolean = false
  protected botThinkingPlaceholder: string = 'Thinking...'
  protected userMessage: string = ''
  protected messages: MessageModel[] = []

  constructor(private router: Router, private utils: Utils) {
    this.messages.push({
      type: 'bot',
      text: 'Kako vam mogu pomoci ?'
    })
  }

  async sendUserMessage() {
    if (this.waitingForResponse) return

    const trimmedMessage = this.userMessage
    this.userMessage = ''

    this.messages.push({
      type: 'user',
      text: trimmedMessage
    })

    this.messages.push({
      type: 'bot',
      text: this.botThinkingPlaceholder
    })

    // RasaService.sendMessage(trimmedMessage)
    //   .then(rsp => {
    //     if (rsp.data.length == 0) {
    //       this.messages.push({
    //         type: 'bot',
    //         text: 'Izvinite, nisam u mogucnosti da vam odgovorim na ovu poruku.'
    //       })
    //       return
    //     }

    //     for (let botMessage of rsp.data) {
    //       this.messages.push({
    //         type: 'bot',
    //         text: botMessage.text
    //       })
    //     }

    //     this.messages = this.messages.filter(m => {
    //       if (m.type === 'bot') {
    //         return m.text != this.botThinkingPlaceholder
    //       }
    //       return true
    //     })

    //   })
    if(trimmedMessage.includes('all toys')){
      const toys = await ToyService.getToys()
      const arr = toys.data.map(m=>`<li><a href="/toy/${m.permalink}">${m.name} (${m.price})</a>`)
      this.messages.push({
        type : 'bot',
        text : `<ul>${arr.toString()}</ul>`
      })
      this.removeBotPlaceholder()
    }


  }

  removeBotPlaceholder(){
    this.messages =this.messages.filter(m=>{
      if(m.type=== 'bot'){
        return
      }
    })
  }

  getUserName() {
    const user = UserService.getActiveUser()
    return `${user.firstName} ${user.lastName}`
  }

  hasAuth() {
    return UserService.hasAuth()
  }
  doLogout() {
    this.utils.showDialog(
      "Are you sure you want to logout ?", () => {
        UserService.logout()
        this.router.navigateByUrl('/login')
      },
      "Logout Now",
      "Don't Logout"
    )
  }
  chatOpen = signal(false);

  toggleChat() {
    this.chatOpen.update(v => !v);
  }

  closeChat() {
    this.chatOpen.set(false);
  }
}

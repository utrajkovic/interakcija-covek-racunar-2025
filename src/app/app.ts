import { Component, signal, OnInit, OnDestroy } from '@angular/core';
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
export class App implements OnInit, OnDestroy {
  protected year = new Date().getFullYear()
  protected waitingForResponse: boolean = false
  protected botThinkingPlaceholder: string = 'Thinking...'
  protected userMessage: string = ''
  protected messages: MessageModel[] = []

  showHelpHint = signal(false);
  private hintIntervalId: any;
  private hintTimeoutId: any;

  constructor(private router: Router, private utils: Utils) {
    this.messages.push({
      type: 'bot',
      text: 'Cao! Mogu da ti pomognem da pronadjes igracke. Reci npr: „prikazi sve igracke“, „trazi igracku plisana panda“, „igracke za 3-5“ ili „preporuci igracku do 2000 din“.'
    })
  }

  ngOnInit(): void {
    setTimeout(() => this.triggerHint(), 3000);

    this.hintIntervalId = setInterval(() => {
      if (!this.chatOpen()) {
        this.triggerHint();
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    clearInterval(this.hintIntervalId);
    clearTimeout(this.hintTimeoutId);
  }

  private triggerHint(): void {
    if (this.chatOpen() || this.showHelpHint()) return;

    this.showHelpHint.set(true);

    this.hintTimeoutId = setTimeout(() => {
      this.showHelpHint.set(false);
    }, 5000);
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

    RasaService.sendMessage(trimmedMessage)
      .then(rsp => {
        if (rsp.data.length == 0) {
          this.messages.push({ type: 'bot', text: 'Izvinite, nisam u mogucnosti...' })
          return
        }

        for (let botMessage of rsp.data) {
          if (botMessage.text) {
            this.messages.push({ type: 'bot', text: botMessage.text })
          }
          if (botMessage.attachment && Array.isArray(botMessage.attachment)) {
            const listText = botMessage.attachment
              .map((t: any) => `• ${t.name} (${t.price} RSD)`)
              .join('\n');
            this.messages.push({ type: 'bot', text: listText })
          }
        }
      })
      .finally(() => {
        this.messages = this.messages.filter(m => !(m.type === 'bot' && m.text === this.botThinkingPlaceholder))
      })
  }

  removeBotPlaceholder() {
    this.messages = this.messages.filter(m => {
      if (m.type === 'bot') {
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

    if (this.chatOpen()) {
      this.showHelpHint.set(false);
      clearTimeout(this.hintTimeoutId);
    }
  }

  closeChat() {
    this.chatOpen.set(false);
  }
}

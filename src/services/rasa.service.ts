import axios from "axios";
import { v4 as uuidv4 } from 'uuid';


export class RasaService {
    static async sendMessage(content: String) {
        return axios.request<any[]>({
            url: 'https://rasa.singidunum.ac.rs/upis/webhooks/rest/webhook',
            method: 'POST',
            data: {
                "sender": this.obtainSenderId(),
                "message": content
            }

        })
    }

    private static obtainSenderId(){
        if (!localStorage.getItem('icr_sender_id')){
            localStorage.setItem('icr_sender_id', uuidv4()) 
        }
        return localStorage.getItem('icr_sender_id')
    }
}
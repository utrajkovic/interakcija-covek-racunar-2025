import axios from "axios";
import { ToyModel } from "../models/toy.model";

const client = axios.create({
    baseURL: 'https://toy.pequla.com/api',
    headers: {
        'Accept': 'application/json',
        'X-Name': 'ICR/2025'
    }
})

export class ToyService {

    static async getToys() {
        return client.get<ToyModel[]>("/toy");
    }


    static async getToyByPermaLink(permalink: string) {
        return client.get<ToyModel>(`/toy/permalink/${permalink}`)
    }
    static async getToyById(id: number) {
        return client.get<ToyModel>(`/toy/${id}`);
    }

}

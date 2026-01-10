export interface OrderModel {
    orderId: string
    toyId: number
    name: string
    productionDate: string
    quantity: number
    price: number
    status: 'na' | 'paid' | 'canceled' | 'liked' | 'disliked'
}
import { ObjectId } from 'mongodb'

// Specific Product Type Interfaces
export interface IStationeryType {
    _id?: ObjectId
    brand: string
    origin: string
    product_shop: ObjectId
    created_at?: Date
    updated_at?: Date
}

// Specific Product Type Classes
export default class Stationery {
    _id?: ObjectId
    brand: string
    origin: string
    product_shop: ObjectId
    created_at: Date
    updated_at: Date

    constructor({ _id, brand, origin, product_shop, created_at, updated_at }: IStationeryType) {
        const date = new Date()
        this._id = _id
        this.brand = brand
        this.origin = origin
        this.product_shop = product_shop
        this.created_at = created_at || date
        this.updated_at = updated_at || date
    }
}

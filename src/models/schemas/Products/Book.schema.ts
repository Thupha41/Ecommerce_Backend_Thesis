import { ObjectId } from 'mongodb'

// Specific Product Type Interfaces
export interface IBookType {
  _id?: ObjectId
  author: string
  year_published: number
  publisher: string
  product_shop: ObjectId
  created_at?: Date
  updated_at?: Date
}

// Specific Product Type Classes
export default class Book {
  _id?: ObjectId
  author: string
  year_published: number
  publisher: string
  product_shop: ObjectId
  created_at: Date
  updated_at: Date

  constructor({ _id, author, year_published, publisher, product_shop, created_at, updated_at }: IBookType) {
    const date = new Date()
    this._id = _id
    this.author = author
    this.year_published = year_published
    this.publisher = publisher
    this.product_shop = product_shop
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}

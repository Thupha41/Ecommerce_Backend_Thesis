import { ObjectId } from 'mongodb'

interface ISellerType {
  _id?: ObjectId
  name: string
  email: string
  address?: string
  phone?: string
  rating?: number
  created_at?: Date
  updated_at?: Date
  image?: string
  isActive?: boolean
}

export default class Seller {
  _id?: ObjectId
  name: string
  email: string
  address?: string
  phone?: string
  rating?: number
  created_at?: Date
  updated_at?: Date
  image?: string
  isActive?: boolean

  constructor(seller: ISellerType) {
    const date = new Date()
    this._id = seller._id
    this.name = seller.name || ''
    this.email = seller.email
    this.address = seller.address || ''
    this.phone = seller.phone || ''
    this.rating = seller.rating || 0
    this.created_at = seller.created_at || date
    this.updated_at = seller.updated_at || date
    this.image = seller.image || ''
    this.isActive = seller.isActive || true
  }
}

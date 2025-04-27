import { ObjectId } from 'mongodb'

interface ResourceType {
  _id?: ObjectId
  resource_url: string
  resource_description: string
  created_at: Date
  updated_at: Date
}

export default class Resource {
  _id?: ObjectId
  resource_url: string
  resource_description: string
  created_at: Date
  updated_at: Date
  constructor(resource: ResourceType) {
    this._id = resource._id
    this.resource_url = resource.resource_url
    this.resource_description = resource.resource_description
    this.created_at = resource.created_at
    this.updated_at = resource.updated_at
  }
}

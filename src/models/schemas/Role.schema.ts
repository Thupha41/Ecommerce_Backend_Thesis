import { ObjectId } from 'mongodb'
import { RoleStatus } from '../../constants/enums'
interface RoleGrant {
  resources: ObjectId
  actions: string
}
interface RoleType {
  _id?: ObjectId
  role_name: string
  role_description: string
  role_status: RoleStatus
  user_role?: ObjectId
  role_grant: RoleGrant[]
  created_at?: Date
  updated_at?: Date
}

export default class Role {
  _id?: ObjectId
  role_name: string
  role_description: string
  role_status: RoleStatus //default: active
  created_at: Date
  updated_at: Date
  role_grant: RoleGrant[]
  constructor(role: RoleType) {
    const date = new Date()
    this._id = role._id
    this.role_name = role.role_name || ''
    this.role_description = role.role_description || ''
    this.role_status = role.role_status || RoleStatus.Active
    this.created_at = role.created_at || date
    this.updated_at = role.updated_at || date
    this.role_grant = role.role_grant || []
  }
}

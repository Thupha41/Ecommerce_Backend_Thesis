import { ObjectId } from "mongodb";

export interface IUpsertCategoryReqBody {
    category_name: string
    category_slug: string
    image: string
    parent_id: ObjectId | null
    level: number
}
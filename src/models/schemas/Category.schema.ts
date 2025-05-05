import { ObjectId } from 'mongodb';
import { generateSlug } from '~/utils';
interface ICategory {
    _id?: ObjectId;
    category_name: string; // Tên danh mục
    category_slug: string; // Đường dẫn thân thiện
    image: string; // URL hình ảnh đại diện
    parent_id?: ObjectId | null; // ID của danh mục cha, null cho Level 1
    level: number; // Cấp của danh mục (1, 2, 3, 4), giới hạn tối đa 4
    ancestors: Array<{
        _id: ObjectId;
        category_name: string;
        category_slug: string;
    }>; // Danh sách tổ tiên (từ Level 1 đến cấp cha trực tiếp)
    category_path?: string; // Đường dẫn dạng "level1_id/level2_id/level3_id/level4_id"
    created_at?: Date;
    updated_at?: Date;
}

export default class Category {
    _id?: ObjectId;
    category_name: string;
    category_slug: string;
    image: string;
    parent_id: ObjectId | null;
    level: number;
    ancestors: Array<{
        _id: ObjectId;
        category_name: string;
        category_slug: string;
    }>;
    category_path?: string;
    created_at: Date;
    updated_at: Date;

    constructor({
        _id,
        category_name,
        category_slug,
        image,
        parent_id,
        level,
        ancestors,
        category_path,
        created_at,
        updated_at,
    }: ICategory) {
        const date = new Date();
        this._id = _id;
        this.category_name = category_name;
        this.category_slug = category_slug || generateSlug(category_name);
        this.image = image;
        this.parent_id = parent_id || null;
        this.level = level;
        this.ancestors = ancestors || [];
        this.category_path = category_path || '';
        this.created_at = created_at || date;
        this.updated_at = updated_at || date;
    }
}
import { ObjectId } from "mongodb"
import databaseService from "./database.services"
import HTTP_STATUS from "~/constants/httpStatus"
import { ErrorWithStatus } from "~/models/Errors"
import { CATEGORIES_MESSAGES, USERS_MESSAGES } from "~/constants/messages"
import { IUpsertCategoryReqBody } from "~/models/requests/categories.requests"
import Category from "~/models/schemas/Category.schema"
class CategoriesService {
    async createCategory(user_id: string, payload: IUpsertCategoryReqBody) {
        const { category_name, category_slug, image, parent_id, level } = payload;

        const user = await databaseService.users.findOne({
            _id: new ObjectId(user_id),
        });
        if (!user) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        let ancestors: Array<{ _id: ObjectId; category_name: string; category_slug: string }> = [];
        let category_path = '';

        if (parent_id) {
            const parent = await databaseService.categories.findOne({
                _id: new ObjectId(parent_id),
            });
            if (!parent) {
                throw new ErrorWithStatus({
                    message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
                    status: HTTP_STATUS.NOT_FOUND,
                });
            }
            if (parent.level !== level - 1) {
                throw new ErrorWithStatus({
                    message: `Parent level must be ${level - 1}`,
                    status: HTTP_STATUS.BAD_REQUEST,
                });
            }
            ancestors = [
                ...parent.ancestors,
                { _id: parent._id, category_name: parent.category_name, category_slug: parent.category_slug },
            ];
            category_path = parent.category_path || ''; // Tạm lưu
        } else {
            if (level !== 1) {
                throw new ErrorWithStatus({
                    message: CATEGORIES_MESSAGES.LEVEL_MUST_BE_1_IF_PARENT_ID_IS_NOT_PROVIDED,
                    status: HTTP_STATUS.BAD_REQUEST,
                });
            }
            category_path = ''; // Tạm lưu
        }

        const newCategory = new Category({
            category_name,
            category_slug,
            image,
            parent_id: parent_id ? new ObjectId(parent_id) : null,
            level,
            ancestors,
        });

        const result = await databaseService.categories.insertOne(newCategory);
        const insertedId = result.insertedId;

        category_path = parent_id
            ? `${(await databaseService.categories.findOne({ _id: new ObjectId(parent_id) }))?.category_path}/${insertedId}`
            : insertedId.toString();

        await databaseService.categories.updateOne(
            { _id: insertedId },
            { $set: { category_path } }
        );

        const updatedCategory = await databaseService.categories.findOne({
            _id: insertedId,
        });

        return { _id: insertedId, ...updatedCategory };
    }
    // Sửa danh mục
    async updateCategory(user_id: string, categoryId: string, payload: IUpsertCategoryReqBody) {
        const { category_name, category_slug, image, parent_id, level } = payload;

        const user = await databaseService.users.findOne({
            _id: new ObjectId(user_id)
        })
        if (!user) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
            })
        }
        // Validate category existence
        const category = await databaseService.categories.findOne({
            _id: new ObjectId(categoryId),
        });
        if (!category) {
            throw new ErrorWithStatus({
                message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Prepare update fields
        const updateFields: Partial<Category> = {
            updated_at: new Date(),
        };
        if (category_name) updateFields.category_name = category_name;
        if (category_slug) updateFields.category_slug = category_slug;
        if (image) updateFields.image = image;

        if (level || parent_id !== undefined) {
            const newLevel = level || category.level;

            let newParentId: ObjectId | null = parent_id ? new ObjectId(parent_id) : null;
            if (parent_id === null) newParentId = null;

            let ancestors: Array<{ _id: ObjectId; category_name: string; category_slug: string }> = [];
            let category_path = '';

            if (newParentId) {
                const parent = await databaseService.categories.findOne({
                    _id: newParentId,
                });
                if (!parent) {
                    throw new ErrorWithStatus({
                        message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
                        status: HTTP_STATUS.NOT_FOUND,
                    });
                }

                if (parent.level !== newLevel - 1) {
                    throw new ErrorWithStatus({
                        message: `Parent level must be ${newLevel - 1}`,
                        status: HTTP_STATUS.BAD_REQUEST,
                    });
                }

                ancestors = [
                    ...parent.ancestors,
                    { _id: parent._id, category_name: parent.category_name, category_slug: parent.category_slug },
                ];
                category_path = `${parent.category_path}/${categoryId}`;
            } else {
                if (newLevel !== 1) {
                    throw new ErrorWithStatus({
                        message: CATEGORIES_MESSAGES.LEVEL_MUST_BE_1_IF_PARENT_ID_IS_NOT_PROVIDED,
                        status: HTTP_STATUS.BAD_REQUEST,
                    });
                }
                ancestors = [];
                category_path = categoryId;
            }

            updateFields.level = newLevel;
            updateFields.parent_id = newParentId;
            updateFields.ancestors = ancestors;
            updateFields.category_path = category_path;
        }

        const updatedCategory = await databaseService.categories.findOneAndUpdate(
            { _id: new ObjectId(categoryId) },
            { $set: updateFields },
            { returnDocument: 'after' }
        );

        return updatedCategory;
    }

    // Xóa danh mục
    async deleteCategory(user_id: string, categoryId: string) {

        const user = await databaseService.users.findOne({
            _id: new ObjectId(user_id)
        })
        if (!user) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
            })
        }
        // Check if category exists
        const category = await databaseService.categories.findOne({
            _id: new ObjectId(categoryId),
        });
        if (!category) {
            throw new ErrorWithStatus({
                message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Check if category has children
        const children = await databaseService.categories
            .find({ parentId: new ObjectId(categoryId) })
            .toArray();
        if (children.length > 0) {
            throw new ErrorWithStatus({
                message: CATEGORIES_MESSAGES.CATEGORY_HAS_CHILDREN,
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        // Check if category is linked to any products
        const products = await databaseService.products
            .find({ product_category: new ObjectId(categoryId) })
            .toArray();
        if (products.length > 0) {
            throw new ErrorWithStatus({
                message: 'Cannot delete category linked to products',
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        const result = await databaseService.categories.deleteOne({
            _id: new ObjectId(categoryId),
        });

        return result;
    }

    // Lấy danh mục theo ID
    async getCategoryById(categoryId: string) {
        const category = await databaseService.categories.findOne({
            _id: new ObjectId(categoryId),
        });
        if (!category) {
            throw new ErrorWithStatus({
                message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }
        return category;
    }

    // Lấy danh mục theo cấp (level)
    async getCategoriesByLevel(level: number) {
        if (level < 1 || level > 4) {
            throw new ErrorWithStatus({
                message: CATEGORIES_MESSAGES.LEVEL_MUST_BE_1_TO_4,
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }
        return await databaseService.categories
            .find({ level })
            .project({
                _id: 1,
                category_name: 1,
                image: 1,
                level: 1,
            })
            .toArray();
    }

    // Lấy danh mục con theo parentId
    async getChildrenCategories(parentId: string) {
        return await databaseService.categories
            .find({ parent_id: new ObjectId(parentId) })
            .project({
                _id: 1,
                category_name: 1,
                image: 1,
                level: 1,
            })
            .toArray();
    }

    async getProductsByCategoryHierarchy(categoryId: string) {
        // Kiểm tra danh mục tồn tại
        const category = await databaseService.categories.findOne({
            _id: new ObjectId(categoryId),
        });
        if (!category) {
            throw new ErrorWithStatus({
                message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
            });
        }

        // Đảm bảo danh mục là cấp 4 (leaf category) để lấy nhánh
        if (category.level !== 4) {
            throw new ErrorWithStatus({
                message: "Only leaf categories (Level 4) can be used to fetch hierarchy products",
                status: HTTP_STATUS.BAD_REQUEST,
            });
        }

        // Lấy tiền tố đường dẫn từ Level 1 đến Level 3
        const categoryPath = category.category_path;
        const pathPrefix = categoryPath?.split('/').slice(0, -1).join('/') || ''; // Loại bỏ _id cấp 4

        // Tìm tất cả danh mục cấp 4 có cùng tiền tố
        const relatedLevel4Categories = await databaseService.categories
            .find({
                category_path: { $regex: `^${pathPrefix}` },
                level: 4,
            })
            .toArray();

        // Lấy danh sách _id của các danh mục cấp 4 liên quan
        const relatedLevel4Ids = relatedLevel4Categories.map((cat) => cat._id);

        // Lấy tất cả sản phẩm thuộc các danh mục cấp 4 này
        const products = await databaseService.products
            .find({
                product_category: { $in: relatedLevel4Ids },
                isPublished: true, // Giả sử có trường isPublished để lọc sản phẩm hợp lệ
                isDeleted: false, // Giả sử có trường isDeleted
            })
            .toArray();

        // Trả về danh sách sản phẩm cùng với thông tin danh mục nhánh
        return {
            category: category,
            relatedCategories: relatedLevel4Categories,
            products: products,
        };
    }
}
const categoriesService = new CategoriesService()
export default categoriesService
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { CATEGORIES_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { IUpsertCategoryReqBody } from '~/models/requests/categories.requests'
import Category from '~/models/schemas/Category.schema'
class CategoriesService {
  async createCategory(user_id: string, payload: IUpsertCategoryReqBody) {
    const { category_name, category_slug, image, parent_id, level } = payload

    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    let ancestors: Array<{ _id: ObjectId; category_name: string; category_slug: string }> = []
    let category_path = ''

    if (parent_id) {
      const parent = await databaseService.categories.findOne({
        _id: new ObjectId(parent_id)
      })
      if (!parent) {
        throw new ErrorWithStatus({
          message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      if (parent.level !== level - 1) {
        throw new ErrorWithStatus({
          message: `Parent level must be ${level - 1}`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      ancestors = [
        ...parent.ancestors,
        { _id: parent._id, category_name: parent.category_name, category_slug: parent.category_slug }
      ]
      category_path = parent.category_path || '' // Tạm lưu
    } else {
      if (level !== 1) {
        throw new ErrorWithStatus({
          message: CATEGORIES_MESSAGES.LEVEL_MUST_BE_1_IF_PARENT_ID_IS_NOT_PROVIDED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      category_path = '' // Tạm lưu
    }

    const newCategory = new Category({
      category_name,
      category_slug,
      image,
      parent_id: parent_id ? new ObjectId(parent_id) : null,
      level,
      ancestors
    })

    const result = await databaseService.categories.insertOne(newCategory)
    const insertedId = result.insertedId

    category_path = parent_id
      ? `${(await databaseService.categories.findOne({ _id: new ObjectId(parent_id) }))?.category_path}/${insertedId}`
      : insertedId.toString()

    await databaseService.categories.updateOne({ _id: insertedId }, { $set: { category_path } })

    const updatedCategory = await databaseService.categories.findOne({
      _id: insertedId
    })

    return { _id: insertedId, ...updatedCategory }
  }
  // Sửa danh mục
  async updateCategory(user_id: string, categoryId: string, payload: IUpsertCategoryReqBody) {
    const { category_name, category_slug, image, parent_id, level } = payload

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
      _id: new ObjectId(categoryId)
    })
    if (!category) {
      throw new ErrorWithStatus({
        message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Prepare update fields
    const updateFields: Partial<Category> = {
      updated_at: new Date()
    }
    if (category_name) updateFields.category_name = category_name
    if (category_slug) updateFields.category_slug = category_slug
    if (image) updateFields.image = image

    if (level || parent_id !== undefined) {
      const newLevel = level || category.level

      let newParentId: ObjectId | null = parent_id ? new ObjectId(parent_id) : null
      if (parent_id === null) newParentId = null

      let ancestors: Array<{ _id: ObjectId; category_name: string; category_slug: string }> = []
      let category_path = ''

      if (newParentId) {
        const parent = await databaseService.categories.findOne({
          _id: newParentId
        })
        if (!parent) {
          throw new ErrorWithStatus({
            message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        if (parent.level !== newLevel - 1) {
          throw new ErrorWithStatus({
            message: `Parent level must be ${newLevel - 1}`,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }

        ancestors = [
          ...parent.ancestors,
          { _id: parent._id, category_name: parent.category_name, category_slug: parent.category_slug }
        ]
        category_path = `${parent.category_path}/${categoryId}`
      } else {
        if (newLevel !== 1) {
          throw new ErrorWithStatus({
            message: CATEGORIES_MESSAGES.LEVEL_MUST_BE_1_IF_PARENT_ID_IS_NOT_PROVIDED,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
        ancestors = []
        category_path = categoryId
      }

      updateFields.level = newLevel
      updateFields.parent_id = newParentId
      updateFields.ancestors = ancestors
      updateFields.category_path = category_path
    }

    const updatedCategory = await databaseService.categories.findOneAndUpdate(
      { _id: new ObjectId(categoryId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    )

    return updatedCategory
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
      _id: new ObjectId(categoryId)
    })
    if (!category) {
      throw new ErrorWithStatus({
        message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if category has children
    const children = await databaseService.categories.find({ parentId: new ObjectId(categoryId) }).toArray()
    if (children.length > 0) {
      throw new ErrorWithStatus({
        message: CATEGORIES_MESSAGES.CATEGORY_HAS_CHILDREN,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if category is linked to any products
    const products = await databaseService.products.find({ product_category: new ObjectId(categoryId) }).toArray()
    if (products.length > 0) {
      throw new ErrorWithStatus({
        message: 'Cannot delete category linked to products',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const result = await databaseService.categories.deleteOne({
      _id: new ObjectId(categoryId)
    })

    return result
  }

  // Lấy danh mục theo ID
  async getCategoryById(categoryId: string) {
    const category = await databaseService.categories.findOne({
      _id: new ObjectId(categoryId)
    })
    if (!category) {
      throw new ErrorWithStatus({
        message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return category
  }

  // Lấy danh mục theo cấp (level)
  async getCategoriesByLevel(level: number) {
    if (level < 1 || level > 4) {
      throw new ErrorWithStatus({
        message: CATEGORIES_MESSAGES.LEVEL_MUST_BE_1_TO_4,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    return await databaseService.categories
      .find({ level })
      .project({
        _id: 1,
        category_name: 1,
        image: 1,
        level: 1
      })
      .toArray()
  }

  // Lấy danh mục con theo parentId
  async getChildrenCategories(parentId: string) {
    return await databaseService.categories
      .find({ parent_id: new ObjectId(parentId) })
      .project({
        _id: 1,
        category_name: 1,
        image: 1,
        level: 1
      })
      .toArray()
  }

  async getProductsByCategoryHierarchy(categoryId: string) {
    // Bước 1: Kiểm tra danh mục tồn tại
    console.log('Step 1: Checking if category exists with categoryId:', categoryId)
    const category = await databaseService.categories.findOne({
      _id: new ObjectId(categoryId)
    })
    if (!category) {
      console.log('Category not found for categoryId:', categoryId)
      throw new ErrorWithStatus({
        message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    console.log('Found category:', category)

    // Bước 2: Kiểm tra xem danh mục hiện tại có con hay không
    console.log('Step 2: Checking if category has children...')
    const hasChildren =
      (await databaseService.categories.countDocuments({
        category_path: { $regex: `^${category.category_path}/${category._id}` }
      })) > 0
    console.log('Has children:', hasChildren)

    // Bước 3: Khởi tạo danh sách danh mục liên quan và ID
    console.log('Step 3: Initializing related categories and IDs')
    let relatedCategories: any[] = [category] // Bao gồm danh mục hiện tại
    let relatedLevelIds: ObjectId[] = [new ObjectId(categoryId)]
    console.log('Initial relatedCategories:', relatedCategories)
    console.log('Initial relatedLevelIds:', relatedLevelIds)

    // Bước 4: Nếu có con, lấy tất cả danh mục trong nhánh
    if (hasChildren) {
      console.log('Step 4: Category has children, getting all related categories in branch...')
      const pathPrefix = category?.category_path?.split('/').slice(0, -1).join('/') || ''
      console.log('Path prefix for branch:', pathPrefix)
      relatedCategories = await databaseService.categories
        .find({
          category_path: { $regex: `^${pathPrefix}` }
        })
        .toArray()
      console.log('All related categories:', relatedCategories)
      relatedLevelIds = relatedCategories.map((cat) => cat._id)
      console.log('Updated relatedLevelIds:', relatedLevelIds)
    } else {
      console.log('Step 4: Category is a leaf, no children to fetch.')
    }

    // Bước 5: Lấy danh sách sản phẩm từ các danh mục liên quan
    console.log('Step 5: Fetching products for related category IDs:', relatedLevelIds)
    const products = await databaseService.productSPUs
      .find({
        product_category: { $in: relatedLevelIds },
        isPublished: true,
        isDeleted: false
      })
      .project({
        product_name: 1,
        product_thumb: 1,
        product_price: 1
      })
      .toArray()
    console.log('Fetched products:', products)

    // Bước 6: Trả về kết quả
    console.log('Step 6: Returning result')
    const result = {
      category: category,
      relatedCategories: relatedCategories,
      products: products
    }
    console.log('Final result:', result)
    return result
  }

  async getCategoryByName(categoryName: string) {
    const category = await databaseService.categories.findOne({
      category_name: categoryName
    })
    if (!category) {
      throw new ErrorWithStatus({
        message: CATEGORIES_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return category
  }
}
const categoriesService = new CategoriesService()
export default categoriesService

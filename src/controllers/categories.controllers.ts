import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import categoriesService from '~/services/categories.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { CATEGORIES_MESSAGES } from '~/constants/messages'
import { IUpsertCategoryReqBody } from '~/models/requests/categories.requests'
import { TokenPayload } from '~/models/requests/users.requests'
// Tạo danh mục
export const createCategoryController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const payload = req.body as IUpsertCategoryReqBody
  const result = await categoriesService.createCategory(user_id, payload)
  res.status(HTTP_STATUS.CREATED).json({
    message: CATEGORIES_MESSAGES.CATEGORY_CREATED_SUCCESS,
    result
  })
  return
}

// Sửa danh mục
export const updateCategoryController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { categoryId } = req.params
  const payload = req.body as IUpsertCategoryReqBody
  const result = await categoriesService.updateCategory(user_id, categoryId, payload)
  res.json({
    message: CATEGORIES_MESSAGES.CATEGORY_UPDATED_SUCCESS,
    result
  })
  return
}

// Xóa danh mục
export const deleteCategoryController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { categoryId } = req.params
  const result = await categoriesService.deleteCategory(user_id, categoryId)
  res.json({
    message: CATEGORIES_MESSAGES.CATEGORY_DELETED_SUCCESS,
    result
  })
  return
}

// Lấy danh mục theo ID
export const getCategoryByIdController = async (req: Request, res: Response) => {
  const { categoryId } = req.params
  const result = await categoriesService.getCategoryById(categoryId)
  res.json({
    message: CATEGORIES_MESSAGES.GET_CATEGORY_SUCCESS,
    result
  })
  return
}

// Lấy danh mục theo cấp (level)
export const getCategoriesByLevelController = async (req: Request, res: Response) => {
  const { level } = req.params
  const result = await categoriesService.getCategoriesByLevel(parseInt(level))
  res.json({
    message: CATEGORIES_MESSAGES.GET_CATEGORIES_SUCCESS,
    result
  })
}

// Lấy danh mục con theo parentId
export const getChildrenCategoriesController = async (req: Request, res: Response) => {
  const { parentId } = req.params
  const result = await categoriesService.getChildrenCategories(parentId)
  res.json({
    message: CATEGORIES_MESSAGES.GET_CHILDREN_CATEGORIES_SUCCESS,
    result
  })
  return
}

// Lấy tất cả sản phẩm thuộc nhánh danh mục (Level 1-4) theo Cách 1
export const getProductsByCategoryHierarchyController = async (req: Request, res: Response) => {
  const { categoryId } = req.params
  const result = await categoriesService.getProductsByCategoryHierarchy(categoryId)
  res.json({
    message: CATEGORIES_MESSAGES.GET_PRODUCTS_BY_HIERARCHY_SUCCESS,
    result
  })
  return
}

// Lấy danh mục theo tên
export const getCategoryByNameController = async (req: Request, res: Response) => {
  const { categoryName } = req.params
  const result = await categoriesService.getCategoryByName(categoryName)
  res.json({
    message: CATEGORIES_MESSAGES.GET_CATEGORY_BY_NAME_SUCCESS,
    result
  })
  return
}

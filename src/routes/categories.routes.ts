import { Router } from 'express';
import { wrapRequestHandler } from '~/utils/handlers';
import {
    createCategoryController,
    updateCategoryController,
    deleteCategoryController,
    getCategoryByIdController,
    getCategoriesByLevelController,
    getChildrenCategoriesController,
    getProductsByCategoryHierarchyController
} from '~/controllers/categories.controllers';
import {
    handleCategoryMediaUpload,
    createCategoryValidator
} from '~/middlewares/categories.middlewares';

const categoryRouter = Router();

/**
 * Description: Create category
 * Path: /
 * Method: POST
 * Access: Private
 */
categoryRouter.post(
    '/',
    handleCategoryMediaUpload,
    createCategoryValidator,
    wrapRequestHandler(createCategoryController)
);

/**
 * Description: Get categories by level (1-4)
 * Path: /level/:level
 * Method: GET
 * Access: Public
 */
categoryRouter.get(
    '/level/:level',
    wrapRequestHandler(getCategoriesByLevelController)
);

/**
 * Description: Get children categories by parent ID
 * Path: /children/:parentId
 * Method: GET
 * Access: Public
 */
categoryRouter.get(
    '/children/:parentId',
    wrapRequestHandler(getChildrenCategoriesController)
);

/**
 * Description: Get products by category hierarchy
 * Path: /products/:categoryId
 * Method: GET
 * Access: Public
 */
categoryRouter.get(
    '/products/:categoryId',
    wrapRequestHandler(getProductsByCategoryHierarchyController)
);

/**
 * Description: Update category
 * Path: /:categoryId
 * Method: PUT
 * Access: Private
 */
categoryRouter.put(
    '/:categoryId',
    handleCategoryMediaUpload,
    createCategoryValidator,
    wrapRequestHandler(updateCategoryController)
);

/**
 * Description: Delete category
 * Path: /:categoryId
 * Method: DELETE
 * Access: Private
 */
categoryRouter.delete(
    '/:categoryId',
    wrapRequestHandler(deleteCategoryController)
);

/**
 * Description: Get category by ID
 * Path: /:categoryId
 * Method: GET
 * Access: Public
 */
categoryRouter.get(
    '/:categoryId',
    wrapRequestHandler(getCategoryByIdController)
);

export default categoryRouter; 
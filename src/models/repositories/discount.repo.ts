import { getSelectData, getUnSelectData } from '~/utils'

export const findAllDiscountCodeUnselect = async ({
  limit = 50,
  page = 1,
  sort = 'ctime',
  unSelect,
  filter,
  model
}: {
  limit: number
  page: number
  sort: string
  unSelect: string[]
  filter: any
  model: any
}) => {
  const skip = (page - 1) * limit
  const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 }
  const documents = await model
    .find(filter)
    .project(getUnSelectData(unSelect))
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .toArray()

  return documents
}

export const findAllDiscountCodeSelect = async ({
  limit = 50,
  page = 1,
  sort = 'ctime',
  select,
  filter,
  model
}: {
  limit: number
  page: number
  sort: string
  select: string[]
  filter: any
  model: any
}) => {
  const skip = (page - 1) * limit
  const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 }
  const documents = await model.find(filter).sort(sortBy).skip(skip).limit(limit).select(getSelectData(select)).lean()

  return documents
}

export const checkDiscountExist = async ({ model, filter }: { model: any; filter: any }) => {
  return await model.findOne(filter)
}

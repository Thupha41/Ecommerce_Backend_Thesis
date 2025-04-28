import { SortDirection, Sort, ObjectId, Collection, Document } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

class RbacRepo {
  // Phương thức để lấy tất cả bản ghi với phân trang
  async findAll<T extends Document>({
    collection,
    limit,
    sort,
    page,
    filter = {}
  }: {
    collection: Collection<T>
    limit: number
    sort: string
    page: number
    filter?: object
  }) {
    const skip = (page - 1) * limit
    const sortBy: Sort = sort === 'ctime' ? { _id: -1 as SortDirection } : { _id: 1 as SortDirection }

    return await collection.find(filter).sort(sortBy).skip(skip).limit(limit).toArray()
  }

  // Phương thức để lấy một bản ghi theo ID
  async findById<T extends Document>({
    collection,
    id,
    errorMessage
  }: {
    collection: Collection<T>
    id: string
    errorMessage: string
  }) {
    if (!ObjectId.isValid(id)) {
      throw new ErrorWithStatus({
        message: 'Invalid ObjectId',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const result = await collection.findOne({ _id: new ObjectId(id) } as any)

    if (!result) {
      throw new ErrorWithStatus({
        message: errorMessage,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result
  }

  // Phương thức để tạo một bản ghi mới
  async create<T extends Document>({ collection, data }: { collection: Collection<T>; data: any }) {
    const result = await collection.insertOne(data as any)
    return {
      _id: result.insertedId,
      ...data
    }
  }

  // Phương thức để cập nhật một bản ghi
  async update<T extends Document>({
    collection,
    id,
    data,
    errorMessage
  }: {
    collection: Collection<T>
    id: string
    data: any
    errorMessage: string
  }) {
    if (!ObjectId.isValid(id)) {
      throw new ErrorWithStatus({
        message: 'Invalid ObjectId',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) } as any,
      { $set: { ...data, updated_at: new Date() } },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new ErrorWithStatus({
        message: errorMessage,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result
  }

  // Phương thức để xóa một bản ghi
  async delete<T extends Document>({
    collection,
    id,
    errorMessage
  }: {
    collection: Collection<T>
    id: string
    errorMessage: string
  }) {
    if (!ObjectId.isValid(id)) {
      throw new ErrorWithStatus({
        message: 'Invalid ObjectId',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) } as any)

    if (!result) {
      throw new ErrorWithStatus({
        message: errorMessage,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result
  }

  // Kiểm tra xem một bản ghi có tồn tại không
  async exists<T extends Document>({ collection, filter }: { collection: Collection<T>; filter: object }) {
    const count = await collection.countDocuments(filter as any, { limit: 1 })
    return count > 0
  }
}

export const rbacRepository = new RbacRepo()

import _ from 'lodash'

export const removeNull = (object: any) => {
  return _.omitBy(object, _.isNil)
}

export const getInfoData = ({ field = [], object = {} }: { field: string[]; object: Record<string, any> }) => {
  return _.pick(object, field)
}

// ['a', 'b'] => {a: 1, b: 1}
export const getSelectData = (select: string[] = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]))
}

export const getUnSelectData = (select: string[] = []) => {
  return Object.fromEntries(select.map((el) => [el, 0]))
}

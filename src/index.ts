import { isArray, isObject } from 'is-what'

type Extension = (param1: any, param2: any) => any

interface IConfig {
  extensions: Extension[]
}

function isObjectLike<T extends object>(payload: any): payload is T {
  return isObject(payload)
}

function mergeRecursively(origin: any, newComer: any, extensions: Extension[]) {
  // work directly on newComer if its not an object
  if (!isObjectLike(newComer)) {
    // extend merge rules
    if (extensions && isArray(extensions)) {
      extensions.forEach(extend => {
        newComer = extend(origin, newComer)
      })
    }
    return newComer
  }
  // define newObject to merge all values upon
  const newObject = (isObjectLike(origin))
    ? Object.keys(origin)
      .reduce((carry, key) => {
        const targetVal = origin[key]
        // @ts-ignore
        if (!Object.keys(newComer).includes(key)) carry[key] = targetVal
        return carry
      }, {})
    : {}
  return Object.keys(newComer)
    .reduce((carry, key) => {
      // re-define the origin and newComer as targetVal and newVal
      let newVal = newComer[key]
      const targetVal = (isObjectLike(origin))
        ? origin[key]
        : undefined
      // extend merge rules
      if (extensions && isArray(extensions)) {
        extensions.forEach(extend => {
          newVal = extend(targetVal, newVal)
        })
      }
      // early return when targetVal === undefined
      if (targetVal === undefined) {
        carry[key] = newVal
        return carry
      }
      // When newVal is an object do the merge recursively
      if (isObjectLike(newVal)) {
        carry[key] = mergeRecursively(targetVal, newVal, extensions)
        return carry
      }
      // all the rest
      carry[key] = newVal
      return carry
    }, newObject)
}

/**
 * Merge anything recursively. objects get merged, basic types overwrite objects or other basic types.
 *
 * @param {(IConfig | any)} origin
 * @param {...any[]} newComers
 * @returns the result
 */
export default function (origin: IConfig | any, ...newComers: any[]) {
  let extensions = null
  let base = origin
  if (isObjectLike<IConfig>(origin) && origin.extensions && Object.keys(origin).length === 1) {
    base = {}
    extensions = origin.extensions
  }
  return newComers.reduce((result, newComer) => {
    return mergeRecursively(result, newComer, extensions)
  }, base)
}
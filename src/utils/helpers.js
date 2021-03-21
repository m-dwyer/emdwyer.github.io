export const generateNavigation = (path, label) => {
  if (Boolean(path)) {
    return {
      path: path,
      label,
    }
  }

  return null
}

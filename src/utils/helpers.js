export const generateNavigation = (path, label) => {
  if (Boolean(path)) {
    return {
      path,
      label,
    }
  }

  return null
}

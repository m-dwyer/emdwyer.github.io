import React from "react"
import { generateNavigation } from "../utils/helpers"
import Navigation from "./Navigation"
const BlogNavigation = ({ pageContext }) => {
  const { currentPage, numPages } = pageContext
  const isFirst = currentPage === 1
  const isLast = currentPage === numPages

  const pathPrefix = "/blog"
  const prevPagePath =
    currentPage - 1 === 1 ? pathPrefix : `${pathPrefix}/${currentPage - 1}`
  const nextPagePath = `${pathPrefix}/${currentPage + 1}`

  const previous = !isFirst
    ? generateNavigation(prevPagePath, "Previous")
    : null
  const next = !isLast ? generateNavigation(nextPagePath, "Next") : null

  return <Navigation previous={previous} next={next} />
}

export default BlogNavigation

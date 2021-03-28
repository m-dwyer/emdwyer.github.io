import React from "react"
import { css } from "@emotion/react"
import { graphql } from "gatsby"
import Layout from "../components/layout"

import { generateNavigation } from "../utils/helpers"
import _ from "lodash"
import FluidContainer from "../components/fluidcontainer"
import BlogPost from "../components/blogpost"

const BlogTemplate = ({ data, pageContext }) => {
  const title = _.get(data, "markdownRemark.frontmatter.title")
  const date = _.get(data, "markdownRemark.frontmatter.date")
  const content = _.get(data, "markdownRemark.html")

  const previousSlug = _.get(pageContext, "previous.fields.slug")
  const previousTitle = _.get(pageContext, "previous.frontmatter.title")

  const nextSlug = _.get(pageContext, "next.fields.slug")
  const nextTitle = _.get(pageContext, "next.frontmatter.title")

  const previous = generateNavigation(previousSlug, previousTitle)
  const next = generateNavigation(nextSlug, nextTitle)

  return (
    <Layout>
      <FluidContainer
        css={css`
          max-width: 100%;
          padding: 2em 1.5em;
          max-width: 40em;
        `}
      >
        <BlogPost
          title={title}
          date={date}
          content={content}
          previous={previous}
          next={next}
        />
      </FluidContainer>
    </Layout>
  )
}

export default BlogTemplate

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        date(formatString: "dddd, MMMM Do YYYY")
        tags
      }
    }
  }
`

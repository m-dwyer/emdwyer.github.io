import React from "react"
import { css } from "@emotion/react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import BlogNavigation from "../components/blognavigation"
import BlogWall from "../components/blogwall"
import _ from "lodash"
import FluidContainer from "../components/fluidcontainer"

const Posts = ({ data, pageContext }) => {
  const posts = _.get(data, "posts.nodes")

  return (
    <FluidContainer>
      <h1
        css={css`
          margin-bottom: 1.5em;
        `}
      >
        Blog
      </h1>
      <BlogNavigation pageContext={pageContext} />
      <BlogWall posts={posts} />
    </FluidContainer>
  )
}

Posts.Layout = Layout
export default Posts

export const query = graphql`
  query($skip: Int = 0, $limit: Int = 3) {
    posts: allFile(
      filter: {
        sourceInstanceName: { eq: "blog" }
        internal: { mediaType: { eq: "text/markdown" } }
      }
      sort: { fields: childMarkdownRemark___frontmatter___date, order: DESC }
      limit: $limit
      skip: $skip
    ) {
      nodes {
        childMarkdownRemark {
          id
          excerpt
          frontmatter {
            title
            tags
            date(formatString: "dddd, MMMM Do YYYY")
            cover {
              childImageSharp {
                gatsbyImageData(width: 600, layout: CONSTRAINED)
              }
            }
          }
          fields {
            slug
          }
        }
      }
    }
  }
`

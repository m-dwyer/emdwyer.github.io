import React from "react"
import { css } from "@emotion/core"

import Layout from "../components/layout"
import BlogWall from "../components/blogwall"
import BlogNavigation from "../components/blognavigation"
import { generateNavigation } from "../utils/helpers"
import _ from "lodash"
import FluidContainer from "../components/fluidcontainer"

const Posts = ({ data, pageContext }) => {
  const posts = _.get(data, "posts.nodes")

  const previous = generateNavigation(pageContext.previousPagePath, "Previous")
  const next = generateNavigation(pageContext.nextPagePath, "Next")

  return (
    <Layout>
      <FluidContainer>
        <h1
          css={css`
            margin-bottom: 1.5em;
          `}
        >
          Blog
        </h1>
        <BlogNavigation previous={previous} next={next} />
        <BlogWall posts={posts} />
      </FluidContainer>
    </Layout>
  )
}

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
            date(formatString: "dddd, MMMM Do YYYY")
            cover {
              childImageSharp {
                fluid(maxWidth: 600) {
                  ...GatsbyImageSharpFluid
                }
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

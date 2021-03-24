import React from "react"
import { css } from "@emotion/react"
import { graphql, useStaticQuery } from "gatsby"
import BlogWall from "./blogwall"

const BlogPreview = () => {
  const data = useStaticQuery(
    graphql`
      query {
        posts: allFile(
          filter: {
            sourceInstanceName: { eq: "blog" }
            internal: { mediaType: { eq: "text/markdown" } }
          }
          limit: 3
          sort: {
            fields: childMarkdownRemark___frontmatter___date
            order: DESC
          }
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
  )

  return (
    <>
      <h1
        css={css`
          display: flex;
          justify-content: center;
        `}
      >
        Posts
      </h1>
      <BlogWall posts={data.posts.nodes} />
    </>
  )
}

export default BlogPreview

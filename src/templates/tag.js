import React from "react"
import { graphql } from "gatsby"
import BlogWall from "../components/blogwall"
import _ from "lodash"
import Layout from "../components/layout"

const Tag = ({ data, pageContext }) => {
  return (
    <>
      <h1>{_.capitalize(pageContext.tag)}</h1>
      <BlogWall posts={data.posts.nodes} />
    </>
  )
}

Tag.Layout = Layout
export default Tag

export const query = graphql`
  query($tag: String!) {
    posts: allFile(
      filter: {
        sourceInstanceName: { eq: "blog" }
        internal: { mediaType: { eq: "text/markdown" } }
        childMarkdownRemark: { frontmatter: { tags: { in: [$tag] } } }
      }
      sort: { fields: childMarkdownRemark___frontmatter___date, order: DESC }
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

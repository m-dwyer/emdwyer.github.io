import React from "react"

import { graphql } from "gatsby"
import Layout from "../components/layout"
import BlogPreview from "../components/blogpreview"
import _ from "lodash"

const Index = ({ data }) => {
  const posts = _.get(data, "posts.nodes")

  return <BlogPreview posts={posts} />
}

export default Index

export const query = graphql`
  query {
    posts: allFile(
      filter: {
        sourceInstanceName: { eq: "blog" }
        internal: { mediaType: { eq: "text/markdown" } }
      }
      limit: 3
      sort: { fields: childMarkdownRemark___frontmatter___date, order: DESC }
    ) {
      nodes {
        childMarkdownRemark {
          id
          excerpt
          frontmatter {
            title
            date(formatString: "dddd, MMMM Do YYYY")
          }
          fields {
            slug
          }
        }
      }
    }
    site {
      siteMetadata {
        contact {
          linkedin
          github
          strava
        }
      }
    }
  }
`

import React from "react"
import { css, useTheme } from "@emotion/react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import FluidContainer from "../components/fluidcontainer"
import _ from "lodash"

const Tag = ({ data }) => {
  const theme = useTheme()

  let posts = _.get(data, "posts.edges")

  let postsByTag = {}
  posts.reduce((accum, { node: post }) => {
    let tags = _.get(post, "frontmatter.tags")
    tags = tags.map(t => t.toLowerCase())

    tags.forEach(t => {
      if (!accum.hasOwnProperty(t)) {
        accum[t] = []
      }

      accum[t].push(post)
    })
    return accum
  }, postsByTag)

  return (
    <FluidContainer>
      <h1
        css={css`
          margin-bottom: 1.5em;
        `}
      >
        Tags
      </h1>
      {Object.entries(postsByTag).map(post => {
        return (
          <Link
            to={`/tag/${post[0]}`}
            key={post[0]}
            css={css`
              display: inline-block;
              text-decoration: none;
              text-transform: lowercase;
              border: 2px solid ${theme.colors.forecolour};
              border-radius: 1em;
              padding: 0.25em 1em;
              margin: 0.25em 0.25em;
            `}
          >
            {post[0]} ({post[1].length})
          </Link>
        )
      })}
    </FluidContainer>
  )
}

Tag.Layout = Layout
export default Tag

export const query = graphql`
  query {
    posts: allMarkdownRemark(
      sort: { fields: frontmatter___date, order: DESC }
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            tags
          }
        }
      }
    }
  }
`

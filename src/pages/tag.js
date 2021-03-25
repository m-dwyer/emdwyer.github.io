import React from "react"
import { css } from "@emotion/react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import _ from "lodash"

const Tag = ({ data }) => {
  let posts = _.get(data, "posts.edges")

  let postsByTag = {}
  posts.reduce((accum, { node: post }) => {
    let tags = _.get(post, "frontmatter.tags")
    tags = tags.map(t => t.toLowerCase())
    console.log("tags", tags)

    tags.forEach(t => {
      if (!accum.hasOwnProperty(t)) {
        accum[t] = []
      }

      accum[t].push(post)
    })
    return accum
  }, postsByTag)

  const LIMIT_PER_TAG = 5

  console.log("postsByTag", postsByTag)

  return (
    <Layout>
      <h1>Posts by tag</h1>
      {Object.keys(postsByTag).map(tag => {
        return (
          <section
            key={tag}
            css={css`
              margin-bottom: 5em;
            `}
          >
            <h2>
              <Link
                to={`/tag/${tag}`}
                css={css`
                  text-decoration: none;
                `}
              >
                {_.capitalize(tag)}
              </Link>
            </h2>
            <ul
              css={css`
                margin: 0;
                list-style: circle;
                padding-left: 20px;
              `}
            >
              {postsByTag[tag].slice(0, LIMIT_PER_TAG).map(p => {
                return (
                  <li key={p.fields.slug}>
                    <Link
                      to={p.fields.slug}
                      css={css`
                        text-decoration: none;
                      `}
                    >
                      {p.frontmatter.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </Layout>
  )
}

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

import React from "react"
import { css } from "@emotion/core"

import { graphql } from "gatsby"
import Layout from "../components/layout"
import IndexSection from "../components/indexsection"
import About from "../components/about"
import Contact from "../components/contact"
import BlogPreview from "../components/blogpreview"
import Hero from "../components/hero"
import _ from "lodash"
import HeroBackground from "../../static/bg.svg"

const Index = ({ data }) => {
  const contacts = _.get(data, "site.siteMetadata.contact")
  const posts = _.get(data, "posts.nodes")

  return (
    <Layout>
      <IndexSection
        css={css`
          background-image: linear-gradient(
              rgba(0, 0, 0, 0.5),
              rgba(0, 0, 0, 0.5)
            ),
            url(${HeroBackground});
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        `}
        navLabel="Home"
      >
        <Hero />
      </IndexSection>
      <IndexSection navLabel="About">
        <About />
      </IndexSection>
      <IndexSection navLabel="Contact">
        <Contact contacts={contacts} />
      </IndexSection>
      <IndexSection navLabel="Posts">
        <BlogPreview posts={posts} />
      </IndexSection>
    </Layout>
  )
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
          github
          strava
        }
      }
    }
  }
`

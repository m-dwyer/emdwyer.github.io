import React from "react"
import { css } from "@emotion/react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import { FaCalendar } from "react-icons/fa"
import BlogNavigation from "../components/blognavigation"
import BodyText from "../components/bodytext"
import { generateNavigation } from "../utils/helpers"
import _ from "lodash"
import FluidContainer from "../components/fluidcontainer"

const BlogPost = ({ data, pageContext }) => {
  const content = data.markdownRemark

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
        <main>
          <article
            css={css`
              max-width: 50em;
              text-align: justify;
              margin: 0 auto;
            `}
          >
            <header
              css={css`
                margin-bottom: 2rem;
              `}
            >
              <h1
                css={css`
                  text-align: left;
                  margin-top: 2rem;
                  margin-bottom: 0rem;
                `}
              >
                {content.frontmatter.title}
              </h1>
              <p
                css={css`
                  margin-bottom: 4rem;
                `}
              >
                <FaCalendar
                  css={css`
                    margin: 0 10px 0 0;
                  `}
                />
                {content.frontmatter.date}
              </p>
            </header>
            <section>
              <BodyText content={content.html} />
            </section>
            <footer
              css={css`
                margin-top: 2rem;
              `}
            >
              <BlogNavigation previous={previous} next={next} />
            </footer>
          </article>
        </main>
      </FluidContainer>
    </Layout>
  )
}

export default BlogPost

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        date(formatString: "dddd, MMMM Do YYYY")
      }
    }
  }
`

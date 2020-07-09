import React from "react";
import { css } from "@emotion/core";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import { FaCalendar } from "react-icons/fa";
import BlogNavigation from "../components/blognavigation";
import { generateNavigation } from "../utils/helpers";
import _ from 'lodash';

export default function BlogPost({data, pageContext}) {
  const content = data.markdownRemark;

  const previousSlug = _.get(pageContext, 'previous.fields.slug');
  const previousTitle = _.get(pageContext, 'previous.frontmatter.title');

  const nextSlug = _.get(pageContext, 'next.fields.slug');
  const nextTitle = _.get(pageContext, 'next.frontmatter.title');

  const previous = generateNavigation(previousSlug, previousTitle);
  const next = generateNavigation(nextSlug, nextTitle);

  return (
    <Layout>
      <main css={css`
        margin-left: auto;
        margin-right: auto;
        padding: 5em 3em;
        max-height: 80vh;
        max-width: 80vw;
      `}>
        <article>
          <header css={css`
            margin-bottom: 2em;
          `}>
            <h1 css={css`
              text-align: left;
              margin-top: 2em;
              margin-bottom: 0;
            `}>{content.frontmatter.title}</h1>
            <p css={css`
              margin-top: 0.75rem;
            `}>
              <FaCalendar
                css={css`
                  margin: 0 10px 0 0;
                `} />
                {content.frontmatter.date}
            </p>
          </header>
          <section>
            <div dangerouslySetInnerHTML={{ __html: content.html }} />
          </section>
          <footer css={css`
            margin-top: 2em;
          `}>
            <BlogNavigation
              previous={previous}
              next={next}
            />
          </footer>
        </article>
      </main>
    </Layout>
  );
}

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug }}) {
      html
      frontmatter {
        title
        date(formatString: "dddd, MMMM Do YYYY")
      }
    }
  }
`;
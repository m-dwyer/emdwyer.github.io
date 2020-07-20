import React from "react";
import { css } from "@emotion/core";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import { FaCalendar } from "react-icons/fa";
import BlogNavigation from "../components/blognavigation";
import BodyText from "../components/bodytext"
import { generateNavigation } from "../utils/helpers";
import _ from 'lodash';
import FluidContainer from "../components/fluidcontainer";

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
      <FluidContainer>
        <main>
          <article>
            <header css={css`
              margin-bottom: 2rem;
            `}>
              <h1 css={css`
                text-align: left;
                margin-top: 2rem;
                margin-bottom: 1rem;
              `}>{content.frontmatter.title}</h1>
              <p css={css`
                margin-bottom: 4rem;
              `}>
                <FaCalendar
                  css={css`
                    margin: 0 10px 0 0;
                  `} />
                  {content.frontmatter.date}
              </p>
            </header>
            <section>
              <BodyText content={content.html} />
            </section>
            <footer css={css`
              margin-top: 2rem;
            `}>
              <BlogNavigation
                previous={previous}
                next={next}
              />
            </footer>
          </article>
        </main>
      </FluidContainer>
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
import React from "react";
import { css } from "@emotion/core";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import { FaCalendar } from "react-icons/fa";
import BlogNavigation from "../components/blognavigation";

export default function BlogPost({data, pageContext}) {
  const content = data.markdownRemark;
  const { previous = null, next = null } = pageContext;
  return (
    <Layout>
      <main css={css`
        width: 80vw;
        margin: 5rem auto;
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
              previous={previous ? {path: previous.fields.slug , label: previous.frontmatter.title} : null}
              next={next ? {path: next.fields.slug, label: next.frontmatter.title} : null}
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
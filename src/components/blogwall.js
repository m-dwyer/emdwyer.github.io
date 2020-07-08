import React from "react";
import { css } from "@emotion/core";
import { Link } from "gatsby";
import { FaCalendar } from "react-icons/fa";

export default function BlogWall({ posts }) {
  return (
    <React.Fragment>
      {posts.map(({childMarkdownRemark: p}) => {
        return (
          <React.Fragment key={p.fields.slug}>
            <article
              css={css`
              `}>
                <header>
                  <h2 css={css`
                    margin-bottom: 0.75em;
                  `}>
                    <Link
                      to={p.fields.slug}
                      css={css`
                        color: inherit;
                      `}>
                          {p.frontmatter.title}
                    </Link>
                  </h2>
                  <small>
                    <FaCalendar css={css`
                      margin: 0 10px 0 0;
                    `} />  {p.frontmatter.date}
                  </small>
                </header>
                <section>
                  <p
                    css={css`
                      margin-top: 0.75em;
                      margin-bottom: 2.5em;
                    `}
                    dangerouslySetInnerHTML={{
                      __html: p.frontmatter.description || p.excerpt
                    }}
                  />
                </section>
            </article>
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}
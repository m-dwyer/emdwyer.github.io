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
                display: flex;
                justify-content: space-between;
              `}>
              <Link
                to={p.fields.slug}
                css={css`
                  color: inherit;
                  text-decoration: none;
                `}>
                <header>
                  <h3>
                    {p.frontmatter.title}
                  </h3>
                  <small>
                    <FaCalendar css={css`
                      margin: 0 10px 0 0;
                    `} />  {p.frontmatter.date}
                  </small>
                </header>
                <section>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: p.frontmatter.description || p.excerpt
                    }}
                  />
                </section>
              </Link>
            </article>
            <hr />
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}
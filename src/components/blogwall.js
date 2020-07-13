import React from "react";
import { css } from "@emotion/core";
import { Link } from "gatsby";
import Img from "gatsby-image";
import { FaCalendar } from "react-icons/fa";
import _ from 'lodash';

export default function BlogWall({ posts }) {
  return (
    <div>
      {posts.map(({childMarkdownRemark: p}) => {
        const fluid = _.get(p, "frontmatter.cover.childImageSharp.fluid");
        return (
          <React.Fragment key={p.fields.slug}>
            <article
              css={css`
                width: 40vw;
                margin: 1.5em auto;
              `}>
                <header>
                  <Link
                    to={p.fields.slug}
                    css={css`
                      color: inherit;
                      text-decoration: none;
                  `}>
                    <Img
                      fluid={fluid}
                      css={css`border-radius: 10px;`}
                    />
                    <h2 css={css`
                      margin-bottom: 0.75em;
                    `}>
                    {p.frontmatter.title}
                    </h2>
                    <small>
                      <FaCalendar css={css`
                        margin: 0 10px 0 0;
                      `} />  {p.frontmatter.date}
                    </small>
                  </Link>
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
    </div>
  );
}
import React from "react";
import { css } from "@emotion/core";
import { Link, graphql } from "gatsby";

export default function Blog(props) {
  return (
    <div>
      <h1 css={css`
        display: flex;
        justify-content: center;
      `}>
        Posts
      </h1>
      {props.posts.map(({childMarkdownRemark: p}) => {
        console.log("slug!: ", p.fields.slug);
        return (
          <article key={p.fields.slug}>
            <header>
              <h3>
                <Link to="" css={css`
                  color: inherit;
                  text-decoration: none;
                `}>
                  {p.frontmatter.title}
                </Link>
              </h3>
            </header>
            <section>
              <p
                dangerouslySetInnerHTML={{
                  __html: p.frontmatter.description || p.excerpt
                }}
               />
            </section>
          </article>
        );
      })}
    </div>
  );
}
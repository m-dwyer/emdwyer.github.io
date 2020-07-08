import React from "react";
import { css } from "@emotion/core";
import { Link, graphql, useStaticQuery } from "gatsby";
import { FaArrowRight } from "react-icons/fa";
import BlogWall from "./blogwall";

export default function BlogPreview() {
  const data = 
    useStaticQuery(
      graphql`
        query {
          posts: allFile(
            filter: {sourceInstanceName: {eq: "blog"}},
            limit: 3,
            sort: {fields: childMarkdownRemark___frontmatter___date, order: DESC}
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
        }
      `
    );

  return (
    <React.Fragment>
      <h1 css={css`
        display: flex;
        justify-content: center;
      `}>
        Posts
      </h1>
      <div>
        <BlogWall posts={data.posts.nodes} />
      </div>
      <Link className="link" to="/blog/">
      <div css={css`
        display: flex;
        align-items: center;
      `}>
        <span css={css`
          font-size: 2em;
          padding: 0;
        `}>More</span>
        <button css={css`
          border: 0;
          border-radius: 50%;
          height: 2em;
          width: 2em;
          cursor: pointer;
          margin-top: 0.5em;
        `}>
          <FaArrowRight
            size="1.25em"
            css={css``} />
        </button>
      </div>
      </Link>
    </React.Fragment>
  );
}
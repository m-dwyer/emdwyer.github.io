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
    <div>
      <h1 css={css`
        display: flex;
        justify-content: center;
      `}>
        Posts
      </h1>
      <BlogWall posts={data.posts.nodes} />
      <div>
        <Link className="link" to="/blog/">
          <span>More</span>
          <button css={css`
            border: 0;
            border-radius: 50%;
            height: 20px;
            width: 20px;
            cursor: pointer;
          `}>
            <FaArrowRight size={10} />
          </button>
        </Link>
      </div>
    </div>
  );
}
import React from "react";
import { Link } from "gatsby";
import { css } from "@emotion/core";
import Layout from "../components/layout";
import BlogWall from "../components/blogwall";

export default function Posts({data, pageContext}) {
  const {
    posts: {
      nodes: [
        ...posts
      ]
    }
  } =  data;

  console.log("pageContext: ", pageContext);

  return (
    <Layout>
      <section className="index-section">
      <div>
        <div css={css`
          display: flex;
          flex-flow: row nowrap;
          justify-content: space-between;
        `}>
          {
            pageContext.nextPagePath !== "" && (
              <span>
              <Link className="link" to={pageContext.nextPagePath} rel="next">Next</Link>
              </span>
            ) 
            }
            {pageContext.previousPagePath !== "" && (
              <span>
                <Link className="link" to={pageContext.previousPagePath} rel="prev">Previous</Link>
              </span>
            )}
          </div>
          <hr />
          <BlogWall posts={posts} />
          </div>
      </section>
    </Layout>
  )
}

export const query = graphql`
  query($skip: Int = 0, $limit: Int = 3) {
    posts: allFile(
      filter: {sourceInstanceName: {eq: "posts"}},
      sort: {fields: childMarkdownRemark___frontmatter___date, order: DESC},
      limit: $limit,
      skip: $skip
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
`;
import React from "react";
import Layout from "../components/layout";
import BlogWall from "../components/blogwall";

export default function Posts({data}) {
  const {
    posts: {
      nodes: [
        ...posts
      ]
    }
  } =  data;

  return (
    <Layout>
    <section className="index-section">
      <BlogWall posts={posts} />
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
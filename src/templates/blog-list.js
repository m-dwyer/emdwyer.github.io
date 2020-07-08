import React from "react";
import Layout from "../components/layout";
import BlogWall from "../components/blogwall";
import BlogNavigation from "../components/blognavigation";

export default function Posts({data, pageContext}) {
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
        <div>
          <BlogNavigation
            previous={pageContext.previousPagePath !== "" ? {path: pageContext.previousPagePath, label: 'Previous'} : null}
            next={pageContext.nextPagePath !== "" ? {path: pageContext.nextPagePath, label: 'Next'} : null}
          />
          <hr />
          <BlogWall posts={posts} />
        </div>
      </section>
    </Layout>
  );
}

export const query = graphql`
  query($skip: Int = 0, $limit: Int = 3) {
    posts: allFile(
      filter: {sourceInstanceName: {eq: "blog"}},
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
import React from "react";
import Layout from "../components/layout";
import BlogWall from "../components/blogwall";
import BlogNavigation from "../components/blognavigation";
import { generateNavigation } from "../utils/helpers";

export default function Posts({data, pageContext}) {
  const {
    posts: {
      nodes: [
        ...posts
      ]
    }
  } =  data;

  const previous = generateNavigation(pageContext.previousPagePath, 'Previous');
  const next = generateNavigation(pageContext.nextPagePath, 'Next');

  return (
    <Layout>
      <section className="index-section">
        <div>
          <BlogNavigation
            previous={previous}
            next={next}
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
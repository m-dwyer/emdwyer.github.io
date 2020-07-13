import React from "react";
import Layout from "../components/layout";
import BlogWall from "../components/blogwall";
import Index from "../pages";
import IndexSection from "../components/indexsection";
import _ from "lodash";

export default function Category({data, pageContext}) {
  return(
    <Layout>
      <IndexSection>
        <h1>{_.capitalize(pageContext.category)}</h1>
      <BlogWall posts={data.posts.nodes} />
      </IndexSection>
    </Layout>
  );
}

export const query = graphql`
  query($category: String!) {
    posts: allFile(
      filter: {
        sourceInstanceName: {eq: "blog"},
        internal: {mediaType: {eq: "text/markdown"}},
        childMarkdownRemark: {frontmatter: {category: {eq: $category}}}
      },
      sort: {fields: childMarkdownRemark___frontmatter___date, order: DESC}
    ) {
      nodes {
        childMarkdownRemark {
          id
          excerpt
          frontmatter {
            title,
            category,
            date(formatString: "dddd, MMMM Do YYYY")
            cover {
              childImageSharp {
                fluid(maxWidth: 600) {
                  ...GatsbyImageSharpFluid
                }
              }
            }
          }
          fields {
            slug
          }
        }
      }
    }
  }
`;
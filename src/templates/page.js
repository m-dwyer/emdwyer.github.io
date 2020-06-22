import React from "react";
import Layout from "../components/layout";
import { graphql } from "gatsby";

export default function Page({ data }) {
  const content = data.markdownRemark;
  return (
    <Layout>
      <section>
        <h1>{content.frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      </section>
    </Layout>
  );
}

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug }}) {
      html
      frontmatter {
        title
      }
    }
  }
`;
import React from "react";
import { css } from "@emotion/core";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import _ from 'lodash';

export default function Category({data}) {
  let posts = _.get(data, "posts.edges");

  let postsByCategory = {};
  posts.reduce((accum, {node: post}) => {
    if (!accum.hasOwnProperty(post.frontmatter.category)) {
      accum[post.frontmatter.category] = [];
    }

    accum[post.frontmatter.category].push(post);
    return accum;
  }, postsByCategory);

  return (
    <Layout>
      <h1>Posts by category</h1>
      {
        Object.keys(postsByCategory).map(category => {
          console.log("category: ", category);
          return (
            <div>
              <h2>{category}</h2>
              <ul css={css`
                list-style-type: none;
                margin: 0;
                padding: 0;
              `}>
                {
                  postsByCategory[category].map(p => {
                    return <li key={p.fields.slug}>{p.frontmatter.title}</li>;
                  })
                }
              </ul>
            </div>
          );
        })
      }
    </Layout>
  );
}

export const query = graphql`
  query {
    posts: allMarkdownRemark(sort: {fields: frontmatter___date, order: DESC}) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            category
          }
        }
      }
    }
  }
`;
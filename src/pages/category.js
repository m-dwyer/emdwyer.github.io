import React from "react";
import { css } from "@emotion/core";
import { graphql, Link } from "gatsby";
import Layout from "../components/layout";
import _ from 'lodash';

export default function Category({data}) {
  let posts = _.get(data, "posts.edges");

  let postsByCategory = {};
  posts.reduce((accum, {node: post}) => {
    let category = _.get(post, "frontmatter.category") ?? "miscellaneous";
    category = category.toLowerCase();

    if (!accum.hasOwnProperty(category)) {
      accum[category] = [];
    }

    accum[category].push(post);
    return accum;
  }, postsByCategory);

  const LIMIT_PER_CATEGORY = 5;

  return (
    <Layout>
      <h1>Posts by category</h1>
      {
        Object.keys(postsByCategory).map(category => {
          return (
            <section key={category}>
              <h2>{_.capitalize(category)}</h2>
              <ul css={css`
                margin: 0;
                list-style: circle;
                padding-left: 20px;
              `}>
                {
                  postsByCategory[category].slice(0, LIMIT_PER_CATEGORY).map(p => {
                    return (
                      <li key={p.fields.slug}>
                        <Link
                          css={css`text-decoration: none;`}
                          to={p.fields.slug}
                        >
                          {p.frontmatter.title}
                        </Link>
                      </li>
                    );
                  })
                }
              </ul>
            </section>
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
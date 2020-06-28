const { createFilePath } = require('gatsby-source-filesystem');
const path = require('path');

exports.onCreateNode = ({ node, getNode, actions }) => {
  if (node.internal.type == 'MarkdownRemark') {
    const sourcePaths = {
      posts: '/posts'
    };

    const fileNode = getNode(node.parent);
    const source = fileNode.sourceInstanceName;
    const { createNodeField } = actions;
    const slug = createFilePath({node, getNode});
    createNodeField({
      node,
      name: 'slug',
      value: `${sourcePaths[source] ?? ''}${slug}`
    });
  }
};

exports.createPages = async({ graphql, actions }) => {
    const { createPage } = actions;

    const result = await graphql(`
      query {
        allMarkdownRemark {
          edges {
            node {
              fields {
                slug
              }
            }
          }
        }
      }    
    `);

    result.data.allMarkdownRemark.edges.forEach(({ node }) => {
      createPage({
        path: node.fields.slug,
        component: path.resolve('./src/templates/page.js'),
        context: {
          slug: node.fields.slug
        }
      });
    });
};
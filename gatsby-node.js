const { createFilePath } = require('gatsby-source-filesystem');
const { paginate } = require('gatsby-awesome-pagination');
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

    paginate({
      createPage,
      items: result.data.allMarkdownRemark.edges,
      itemsPerPage: 5,
      pathPrefix: '/posts',
      component: path.resolve('./src/templates/posts.js')
    });
};
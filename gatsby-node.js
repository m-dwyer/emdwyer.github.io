const { createFilePath } = require('gatsby-source-filesystem');
const { paginate } = require('gatsby-awesome-pagination');
const path = require('path');

exports.onCreateNode = ({ node, getNode, actions }) => {
  if (node.internal.type == 'MarkdownRemark') {
    const sourcePaths = {
      blog: '/blog'
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
        posts: allMarkdownRemark {
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

    result.data.posts.edges.forEach(({ node }) => {
      createPage({
        path: node.fields.slug,
        component: path.resolve('./src/templates/page.js'),
        context: {
          slug: node.fields.slug
        }
      });
    });

    paginate({
      createPage,
      items: result.data.posts.edges,
      itemsPerPage: 5,
      pathPrefix: '/blog',
      component: path.resolve('./src/templates/blog-list.js')
    });
};
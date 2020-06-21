const { createFilePath } = require('gatsby-source-filesystem');

exports.onCreateNode = ({ node, getNode, actions }) => {
    if (node.internal.type == 'File' && node.sourceInstanceName == 'pages') {
        const { createNodeField } = actions;
        const slug = createFilePath({node, getNode});
        createNodeField({
            node,
            name: 'slug',
            value: slug
        });
    }
};
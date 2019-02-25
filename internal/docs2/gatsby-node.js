const path = require('path')
const { createFilePath } = require('gatsby-source-filesystem')
const metadata = require('@auth0/cosmos/meta/metadata.json')

// gatsby-node.js
exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
  })
}

function getComponentMetadata(componentName) {
  return JSON.stringify(
    metadata.metadata.find(component => component.displayName === componentName)
  )
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === 'Mdx') {
    const slug = createFilePath({ node, getNode, basePath: `pages` })

    const metadata = getComponentMetadata(node.frontmatter.componentName)

    createNodeField({
      name: 'slug',
      node,
      value: slug,
    })
    createNodeField({
      name: 'template',
      node,
      value: node.frontmatter.template,
    })
    createNodeField({
      name: 'metadata',
      node,
      value: metadata,
    })
  }
}

exports.createPages = ({ graphql, actions }) => {
  // Destructure the createPage function from the actions object
  const { createPage } = actions
  return new Promise((resolve, reject) => {
    resolve(
      graphql(
        `
          {
            allMdx {
              edges {
                node {
                  id
                  fields {
                    slug
                    template
                    metadata
                  }
                  frontmatter {
                    template
                    title
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        // this is some boilerlate to handle errors
        if (result.errors) {
          console.error(result.errors)
          reject(result.errors)
        }
        // We'll call `createPage` for each result
        result.data.allMdx.edges.forEach(({ node }) => {
          console.log(node)

          // Components Index
          if (node.frontmatter.template === 'components') {
            createPage({
              path: node.fields.slug,
              component: path.resolve(`./src/templates/components-index.js`),
              context: {
                id: node.id,
                slug: node.slug,
              },
            })
          } else if (node.frontmatter.template === 'page') {
            // Rest of the pages (Docs pages)
            createPage({
              path: node.fields.slug,
              component: path.resolve(`./src/templates/page.js`),
              context: {
                id: node.id,
                slug: node.slug,
              },
            })
          } else {
            // Components
            createPage({
              path: node.fields.slug,
              component: path.resolve(`./src/templates/component-detail.js`),
              context: {
                id: node.id,
                slug: node.slug,
                metadata: node.metadata,
              },
            })
          }
        })
      })
    )
  })
}

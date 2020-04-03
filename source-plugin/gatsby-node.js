const axios = require("axios")
const WebSocket = require("ws")
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)

const POST_NODE_TYPE = `Post`
const AUTHOR_NODE_TYPE = `Author`
let ws

// helper function for creating nodes
const createNodeFromData = (item, nodeType, helpers) => {
  const nodeMetadata = {
    // you can use createNodeId to link in a custom resolver with schemacustomization to regenerate the same and link correctly
    id: helpers.createNodeId(`${nodeType}-${item.id}`),
    parent: null, // this is used if nodes are derived from other nodes, a little different than a foreign key relationship, more fitting for a transformer plugin that is changing the node
    children: [],
    internal: {
      type: nodeType,
      content: JSON.stringify(item),
      contentDigest: helpers.createContentDigest(item),
    },
  }

  const node = Object.assign({}, item, nodeMetadata)
  helpers.createNode(node)
  return node
}

/**
 * ============================================================================
 * Verify plugin loads
 * ============================================================================
 */

// sanity check to verify the plugin is running
exports.onPreInit = () => console.log("Loaded source-plugin")

/**
 * ============================================================================
 * Link nodes together with a customized GraphQL Schema
 * ============================================================================
 */

exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions
  createTypes(`
    type Post implements Node {
      id: ID!
      slug: String!
      description: String!
      imgUrl: String!
      remoteFile: File @link
      author: Author @link(from: "author.name" by: "name")
    }

    type Author implements Node {
      id: ID!
      name: String!
    }`)
}

/**
 * ============================================================================
 * Source and cache nodes from the API
 * ============================================================================
 */

exports.sourceNodes = async function sourceNodes(
  { actions, cache, createContentDigest, createNodeId, getNodesByType },
  pluginOptions
) {
  const { createNode, touchNode } = actions
  const helpers = Object.assign({}, actions, {
    createContentDigest,
    createNodeId,
  })

  // you can access plugin options here if need be
  console.log(`Space ID: ${pluginOptions.spaceId}`)

  // simple caching example, you can find in .cache/caches/source-plugin/some-diskstore
  await cache.set(`hello`, `world`)
  console.log(await cache.get(`hello`))

  // touch nodes to ensure they aren't garbage collected
  getNodesByType(POST_NODE_TYPE).forEach(node => touchNode({ nodeId: node.id }))
  getNodesByType(AUTHOR_NODE_TYPE).forEach(node =>
    touchNode({ nodeId: node.id })
  )

  // listen for updates using a websocket and subscriptions from the API
  if (pluginOptions.preview) {
    if (!ws) {
      ws = new WebSocket(`ws://localhost:4000`)
      console.log(`Subscribing to content updates at: ws://localhost:4000...`)
    }

    ws.on("open", function open() {
      ws.send("Opened connection with gatsby-node")
      console.log("something") // logs to console
    })

    ws.on("message", function incoming(data) {
      console.log(data)
    })
  }

  // TODO update query to fetch all or only stuff after lastupdatedat
  // set lastUpdated in cache and use that to fetch only new data
  // is that important for inc builds: long running vs shutoff?

  // store the response from the API in the cache
  const cacheKey = "your-source-data-key"
  let sourceData = await cache.get(cacheKey)

  // fetch fresh data if nothiing is found in the cache or a plugin option says not to cache data
  if (!sourceData || !pluginOptions.cacheResponse) {
    console.log("Not using cache for source data, fetching fresh content")
    const {
      data: { data },
    } = await axios({
      method: `post`,
      url: `http://localhost:4000`,
      data: {
        query: `
          query {
            posts {
              id
              slug
              description
              imgUrl
              author {
                id
                name
              }
            }
            authors {
              id
              name
            }
          }
        `,
      },
    })
    await cache.set(cacheKey, data)
    sourceData = data
  }

  // loop through data returned from the api and create Gatsby nodes for them
  sourceData.posts.forEach(post =>
    createNodeFromData(post, POST_NODE_TYPE, helpers)
  )
  sourceData.authors.forEach(author =>
    createNodeFromData(author, AUTHOR_NODE_TYPE, helpers)
  )

  return
}

/**
 * ============================================================================
 * Transform remote file nodes
 * ============================================================================
 */

exports.onCreateNode = async ({
  actions: { createNode },
  getCache,
  createNodeId,
  node,
}) => {
  // transfrom remote file nodes using Gatsby sharp plugins
  // because onCreateNode is called for all nodes, verify that you are only running this code on nodes created by your plugin
  if (node.internal.type === POST_NODE_TYPE) {
    // create a FileNode in Gatsby that gatsby-transformer-sharp will create optimized images for
    const fileNode = await createRemoteFileNode({
      // the url of the remote image to generate a node for
      url: node.imgUrl,
      getCache,
      createNode,
      createNodeId,
      parentNodeId: node.id,
    })

    if (fileNode) {
      // used to add a field `remoteImage` to the Post node from the File node in the schemaCustomization API
      node.remoteImage = fileNode.id

      // inference can link these without schemaCustomization like this, but creates a less sturdy schema
      // node.remoteImage___NODE = fileNode.id
    }
  }
}

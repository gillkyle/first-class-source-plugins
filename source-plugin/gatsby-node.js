const axios = require("axios")
const WebSocket = require("ws")
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)

const NODE_TYPE = `YourSourceItem`
let ws

// sanity check to verify the plugin is running
exports.onPreInit = () => console.log("Loaded source-plugin")

// source nodes from the demo API so Gatsby can query them
exports.sourceNodes = async function sourceNodes(
  { actions, cache, createContentDigest, createNodeId, getNodesByType },
  pluginOptions
) {
  const { createNode, touchNode } = actions

  // you can access plugin options here if need be
  console.log(`Space ID: ${pluginOptions.spaceId}`)

  // simple caching example, you can find in .cache/caches/source-plugin/some-diskstore
  await cache.set(`hello`, `world`)
  console.log(await cache.get(`hello`))

  // touch nodes to ensure they aren't garbage collected
  getNodesByType(NODE_TYPE).forEach(node => touchNode({ nodeId: node.id }))

  // listen for updates using a websocket and subscriptions from the API
  if (pluginOptions.preview) {
    if (!ws) {
      ws = new WebSocket(`ws://localhost:4000`)
      console.log(`Subscribing to content updates at: ws://localhost:4000...`)
    }

    ws.on("open", function open() {
      ws.send("something")
      console.log("something") // logs to console
    })

    ws.on("message", function incoming(data) {
      console.log(data)
    })
  }

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
              description
              url
              imgUrl
            }
          }
        `,
      },
    })
    await cache.set(cacheKey, data)
    sourceData = data
  }

  // loop through posts returned from the api and create Gatsby nodes for them
  sourceData.posts.forEach(post => {
    const nodeMetadata = {
      id: createNodeId(`your-source-${post.id}`),
      parent: null,
      children: [],
      internal: {
        type: NODE_TYPE,
        content: JSON.stringify(post),
        contentDigest: createContentDigest(post),
      },
    }

    const node = Object.assign({}, post, nodeMetadata)
    createNode(node)
  })

  return
}

exports.onCreateNode = async ({
  actions: { createNode },
  getCache,
  createNodeId,
  node,
}) => {
  // transfrom remote file nodes using Gatsby sharp plugins
  // because onCreateNode is called for all nodes, verify that you are only running this code on nodes created by your plugin
  if (node.internal.type === NODE_TYPE) {
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
      // add the field to create a connection between the image node and the new file node
      node["remoteImageFile___NODE"] = fileNode.id
    }
  }
}

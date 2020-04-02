require("dotenv").config()
const { GraphQLServer, PubSub } = require("graphql-yoga")
const uniqid = require("uniqid")

const authors = [
  {
    // TODO maybe remove the unique ID here so I can show the createNodeId helper being used in schemaCustomization
    id: 1,
    name: "Jay Gatsby",
  },
  {
    id: 2,
    name: "Daisy Buchanan",
  },
]

const posts = [
  {
    id: uniqid(),
    slug: "hello-world",
    description: "Our first post on our site.",
    imgUrl: "https://images.unsplash.com/photo-1534432586043-ead5b99229fb",
    authorId: 1,
  },
  {
    id: uniqid(),
    slug: "building-our-company-culture",
    description: "Our vision for a welcoming company.",
    imgUrl: "https://images.unsplash.com/photo-1530041539828-114de669390e",
    authorId: 1,
  },
  {
    id: uniqid(),
    slug: "redesigning-our-logo",
    description: "What went into the new logo.",
    imgUrl: "https://images.unsplash.com/photo-1495121553079-4c61bcce1894",
    authorId: 2,
  },
]

const findPostIdxById = id => {
  let postIdx = null

  for (let idx = 0; idx < posts.length; idx += 1) {
    if (posts[idx].id === id) {
      postIdx = idx
      break
    }
  }

  return postIdx
}

const resolvers = {
  Query: {
    info: () => "A simple GraphQL server example with in-memory data.",
    posts: () => posts,
    authors: () => authors,
  },

  Mutation: {
    createPost: (root, { slug, description }) => {
      const post = {
        id: uniqid(),
        slug,
        description,
      }

      posts.push(post)

      return post
    },

    updatePost: (root, { id, slug, description }) => {
      const postIdx = findPostIdxById(id)

      if (postIdx === null) {
        return null
      }

      posts[postIdx] = { ...posts[postIdx], slug, description }

      return posts[postIdx]
    },

    deletePost: (root, { id }) => {
      const postIdx = findPostIdxById(id)

      if (postIdx === null) {
        return null
      }

      const post = posts[postIdx]

      posts.splice(postIdx, 1)

      return post
    },
  },

  Post: {
    id: root => root.id,
    slug: root => root.slug,
    description: root => root.description,
    author: root => authors.find(author => author.id === root.authorId),
  },

  Author: {
    id: root => root.id,
    name: root => root.name,
  },

  Counter: {
    countStr: counter => `Current count: ${counter.count}`,
  },

  Subscription: {
    counter: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random()
          .toString(36)
          .substring(2, 15) // random channel name
        let count = 0
        setInterval(() => {
          console.log("sending count: " + count)
          pubsub.publish(channel, { counter: { count: count++ } })
        }, 2000)
        return pubsub.asyncIterator(channel)
      },
    },
  },
}

const pubsub = new PubSub()
const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers,
  context: { pubsub },
})

server.start(
  {
    port:
      (process.env.PORT ? parseInt(process.env.PORT, 10) : undefined) || 4000,
  },
  ({ port }) => console.log(`🏃🏻‍ Server is running on port ${port}.`)
)

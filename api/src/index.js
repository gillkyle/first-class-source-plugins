require("dotenv").config()
const { GraphQLServer, PubSub } = require("graphql-yoga")
const uniqid = require("uniqid")

const CREATED = "created"
const UPDATED = "updated"
const DELETED = "deleted"

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
    imgAlt: "Pug in a sweater",
    authorId: 1,
  },
  {
    id: uniqid(),
    slug: "building-our-company-culture",
    description: "Our vision for a welcoming company.",
    imgUrl: "https://images.unsplash.com/photo-1530041539828-114de669390e",
    imgAlt: "Pug in a rainjacket",
    authorId: 1,
  },
  {
    id: uniqid(),
    slug: "redesigning-our-logo",
    description: "What went into the new logo.",
    imgUrl: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc",
    imgAlt: "Pug in glasses",
    authorId: 2,
  },
]

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
        imgUrl: "https://images.unsplash.com/photo-1534432586043-ead5b99229fb",
        imgAlt: "pug in a sweater",
        authorId: 1,
      }

      posts.push(post)
      pubsub.publish(CREATED, { posts: [post] })

      return post
    },

    updatePost: (root, { id, description }) => {
      const postIdx = posts.findIndex(p => id === p.id)

      if (postIdx === null) {
        return null
      }

      posts[postIdx] = { ...posts[postIdx], description }
      pubsub.publish(UPDATED, { posts: [posts[postIdx]] })

      return posts[postIdx]
    },

    deletePost: (root, { id }) => {
      const postIdx = posts.findIndex(p => id === p.id)

      if (postIdx === null) {
        return null
      }

      const post = posts[postIdx]
      pubsub.publish(DELETED, { posts: [posts[postIdx]] })

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

  Subscription: {
    posts: {
      subscribe: (parent, args, { pubsub }) => {
        // const channel = Math.random()
        //   .toString(36)
        //   .substring(2, 15) // random channel name
        // setInterval(() => {
        //   pubsub.publish(channel, { posts })
        // }, 2000)
        return pubsub.asyncIterator([CREATED, UPDATED, DELETED])
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

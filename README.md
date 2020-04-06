# First Class Gatsby Plugins

Create Gatsby plugins that leverage Gatsby's most impactful native features like remote image optimization, caching, customized GraphQL schemas and node relationships, and more.

This monorepo serves as an example of a site using a first class source plugin to pull in data from a Node.js API.

## Setup

This monorepo uses yarn workspaces to manage the 3 indivdual projects:

- api: a Node.js API with in-memory data, and a Post and Author type, as well as support for subscriptions when Posts are mutated
- example-site: a barebones Gatsby site that implements the source plugin
- source-plugin: a plugin that uses several Gatsby APIs to source data from the API, create responsive/optimized images from remote locations, and link the nodes in the example site

To install dependencies for all projects run the install command in the root of the workspace:

```
yarn install
```

Then you can run the api or example projects with:

```
// runs the api with yarn start at port 4000
yarn workspace api start
// runs the example site with gatsby develop at port 8000
yarn workspace example-site develop
```

Running the example site also runs the plugin because it is included in the site's config. You'll see output in the console for different functionality, and then can open up the browser to localhost:8000 to see the site.

You can open up `localhost:4000` and test a query like this to see data returned:

```graphql
{
  posts {
    id
  }
}
```

You can listen for subscription events with this query in the playground:

```graphql
subscription {
  posts {
    id
    description
  }
}
```

A similar subscription is registered when the plugin is run, so you can also see subscription events logged when the plugin is running.

When you run a mutation on a post, a subscription event is published, which lets the plugin know it should respond and update nodes:

```graphql
mutation {
  updatePost(id: "post-id", description: "Some data!") {
    id
    slug
    description
  }
}
```

# First Class Plugins

Monorepo for examples, api, and plugins for creating first class source plugins

## Setup

This monorepo uses yarn workspaces to manage the 3 indivdual projects:

- api
- example-site
- source-plugin

To install dependencies for all projects run the install command in the root of the workspace:

```
yarn install
```

Then you can run the api or example projects with:

```
// runs the example site with gatsby develop at port 8000
yarn workspace example-site develop
// runs the api with yarn start at port 4000
yarn workspace api start
```

You can open up `localhost:4000` and test a query like this to see data returned:

```graphql
{
  posts {
    id
  }
}
```

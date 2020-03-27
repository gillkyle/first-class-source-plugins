import React from "react"
import { graphql } from "gatsby"
import Img from "gatsby-image"

export default ({ data }) => (
  <div>
    Hello world!
    <div>
      {data.images.nodes.map(node => (
        <Img fluid={node.childImageSharp.fluid} />
      ))}
    </div>
  </div>
)

export const query = graphql`
  {
    images: allFile(filter: { extension: { regex: "/(jpg)/" } }) {
      nodes {
        id
        childImageSharp {
          id
          fluid {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  }
`

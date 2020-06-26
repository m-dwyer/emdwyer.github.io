import React from "react";
import { css } from "@emotion/core";
import Layout from "../components/layout";
import About from "../components/about";
import Blog from "../components/blog";
import { FaArrowDown } from "react-icons/fa";

class Index extends React.Component {
  constructor(props) {
    super(props);

    this.separator = React.createRef();

    this.scrollToContent = this.scrollToContent.bind(this);
  }

  scrollToContent() {
    this.separator.current.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  render() {
    const {
      data: {
        posts: {
          nodes: [
            ...posts
          ]
        }
      }
    } = this.props;
    
    console.log("my posts: ", posts);

    return (
      <Layout>
      <section className="index-section">
        <h1>Hi, I'm mdwyer</h1>
        <button
          css={css`
            border: 0;
            border-radius: 50%;
            height: 80px;
            width: 80px;
            cursor: pointer;
          `}
          onClick={this.scrollToContent}
        >
          <FaArrowDown
            size={60}
            css={css`
            `}
          />
        </button>
      </section>
      <section ref={this.separator} className="index-section">
        <About />
      </section>
      <section className="index-section">
        <Blog posts={posts} />
      </section>
    </Layout>  
    );
  }
}

export default Index;

export const query = graphql`
  query {
     posts: allFile(filter: {sourceInstanceName: {eq: "posts"}}, limit: 3) {
      nodes {
        childMarkdownRemark {
          id
          excerpt
          frontmatter {
            title
          }
          fields {
            slug
          }
        }
      }
    }
  }
`;
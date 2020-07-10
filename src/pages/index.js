import React from "react";
import { css } from "@emotion/core";
import { FaArrowDown } from "react-icons/fa";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import IndexSection from "../components/indexsection";
import About from "../components/about";
import Contact from "../components/contact"
import BlogPreview from "../components/blogpreview";
import _ from 'lodash';

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
    const contacts = _.get(this.props, "data.site.siteMetadata.contact");
    const posts = _.get(this.props, "data.posts.nodes");

    return (
      <Layout>
        <IndexSection>
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
            />
          </button>
        </IndexSection>
        <IndexSection forwardedRef={this.separator}>
          <About />
        </IndexSection>
        <IndexSection>
          <Contact contacts={contacts} />
        </IndexSection>
        <IndexSection>
          <BlogPreview posts={posts} />
        </IndexSection>
      </Layout>  
    );
  }
}

export default Index;

export const query = graphql`
  query {
    posts: allFile(
      filter: {sourceInstanceName: {eq: "blog"}}, limit: 3,
      sort: {fields: childMarkdownRemark___frontmatter___date, order: DESC}
    ) {
      nodes {
        childMarkdownRemark {
          id
          excerpt
          frontmatter {
            title
            date(formatString: "dddd, MMMM Do YYYY")
          }
          fields {
            slug
          }
        }
      }
    }
    site {
      siteMetadata {
        contact {
          github
          strava
        }
      }
    }
  }
`;
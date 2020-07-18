import React from "react";
import { css } from "@emotion/core";

import { graphql } from "gatsby";
import Layout from "../components/layout";
import IndexSection from "../components/indexsection";
import About from "../components/about";
import Contact from "../components/contact"
import BlogPreview from "../components/blogpreview";
import CallToAction from "../components/calltoaction";
import _ from 'lodash';
import HeroBackground from "../../static/bg.svg";
import ScrollIndicator from "../components/scrollindicator";

class Index extends React.Component {
  constructor(props) {
    super(props);

    this.heroRef = React.createRef();
    this.aboutRef = React.createRef();
    this.contactRef = React.createRef();
    this.blogRef = React.createRef();

    this.allRefs = [this.heroRef, this.aboutRef, this.contactRef, this.blogRef];

    this.scrollToContent = this.scrollToContent.bind(this);
  }

  scrollToContent() {
    this.contactRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  render() {
    const contacts = _.get(this.props, "data.site.siteMetadata.contact");
    const posts = _.get(this.props, "data.posts.nodes");

    return (
      <Layout>
        <ScrollIndicator sectionRefs={this.allRefs} />
        <IndexSection css={css`
          background-image: linear-gradient(rgba(0, 0, 0, 0.5),rgba(0, 0, 0, 0.5)), url(${HeroBackground});
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        `}
          forwardedRef={this.heroRef}
        >
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
            <CallToAction />
          </button>
        </IndexSection>
        <IndexSection forwardedRef={this.aboutRef}>
          <About />
        </IndexSection>
        <IndexSection forwardedRef={this.contactRef}>
          <Contact contacts={contacts} />
        </IndexSection>
        <IndexSection forwardedRef={this.blogRef}>
          <div css={css`
            width: 40vw;
            margin: 1.5em auto;
          `}>
          <BlogPreview posts={posts} />
          </div>

        </IndexSection>
      </Layout>  
    );
  }
}

export default Index;

export const query = graphql`
  query {
    posts: allFile(
      filter: {
        sourceInstanceName: {eq: "blog"},
        internal: {mediaType: {eq: "text/markdown"}}
      }, limit: 3,
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
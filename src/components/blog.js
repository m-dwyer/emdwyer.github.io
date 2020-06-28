import React from "react";
import { css } from "@emotion/core";
import { Link } from "gatsby";
import { FaCalendar, FaArrowRight } from "react-icons/fa";

export default function Blog(props) {
  return (
    <div>
      <h1 css={css`
        display: flex;
        justify-content: center;
      `}>
        Posts
      </h1>
      {props.posts.map(({childMarkdownRemark: p}) => {
        return (
          <React.Fragment>
            <article
              className="blog-preview"
              key={p.fields.slug}
              css={css`
                display: flex;
                justify-content: space-between;
                width: 60vw;
              `}>
              <Link to={p.fields.slug} css={css`
                    color: inherit;
                    text-decoration: none;
                  `}>
                <header>
                  <h3>
                    {p.frontmatter.title}
                  </h3>
                  <small>
                    <FaCalendar />  {p.frontmatter.date}
                  </small>
                </header>
                <section>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: p.frontmatter.description || p.excerpt
                    }}
                  />
                </section>
              </Link>
            </article>
            <hr />
          </React.Fragment>
        );
      })}
      <div>
        <Link className="link" to="/posts/">
          <span>More</span>
          <button
                css={css`
                  border: 0;
                  border-radius: 50%;
                  height: 20px;
                  width: 20px;
                  cursor: pointer;
                `}
              >
                <FaArrowRight
                  size={10}
                  css={css`
                  `}
                />
          </button>
        </Link>
      </div>
    </div>
  );
}
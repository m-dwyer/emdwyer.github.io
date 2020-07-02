import React from "react";
import { css } from "@emotion/core";
import { Link } from "gatsby";
import { FaArrowRight } from "react-icons/fa";
import BlogWall from "./blogwall";

export default function BlogPreview(props) {
  return (
    <div>
      <h1 css={css`
        display: flex;
        justify-content: center;
      `}>
        Posts
      </h1>
      <BlogWall posts={props.posts} />
      <div>
        <Link className="link" to="/blog/">
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
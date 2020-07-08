import React from "react";
import { css } from "@emotion/core";
import { Link } from "gatsby";

export default function BlogNavigation({previous, next}) {
  return (
    <div css={css`
      display: grid;
      grid-template-columns: 1fr 1fr;
    `}>
      <div css={css`
        text-align: left;
      `}>
        {previous && (
              <Link
                className="link"
                css={css`
                  grid-column: 1;
                `}
                to={previous.path}
                rel="prev">
                {previous.label}
              </Link>

          )
        }
      </div>
      <div css={css`
        text-align: right;
      `}>
        {
          next && (
            <Link
              className="link"
              css={css`
                grid-column: 2;
              `}
              to={next.path}
              rel="next">
              {next.label}
            </Link>
          )
        }
      </div>
    </div>
  );
}
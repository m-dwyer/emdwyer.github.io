import React from "react";
import { css } from "@emotion/core";
import { Link } from "gatsby";

export default function BlogNavigation({previousPagePath, nextPagePath}) {
  return (
    <div css={css`
      display: grid;
      grid-template-columns: 1fr 1fr;
    `}>
      <div css={css`
        text-align: left;
      `}>
        {previousPagePath !== "" && (
              <Link
              className="link"
              css={css`
                grid-column: 1;
              `}
              to={previousPagePath}
              rel="prev">
                &lt;&lt; Previous
              </Link>

          )
        }
      </div>
      <div css={css`
        text-align: right;
      `}>
        {
          nextPagePath !== "" && (
            <Link
            className="link"
            css={css`
              grid-column: 2;
            `}
            to={nextPagePath}
            rel="next">Next &gt;&gt;</Link>
          )
        }
      </div>
    </div>
  );
}
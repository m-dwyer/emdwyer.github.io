import React from "react";
import { css } from "@emotion/core";
import { Link } from "gatsby";

export default function BlogNavigation({previousPagePath, nextPagePath}) {
  return (
    <div css={css`
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
    `}>
      {
        nextPagePath !== "" && (
          <span>
          <Link className="link" to={nextPagePath} rel="next">Next</Link>
          </span>
        ) 
      }
      {previousPagePath !== "" && (
          <span>
            <Link className="link" to={previousPagePath} rel="prev">Previous</Link>
          </span>
        )
      }
    </div>
  );
}
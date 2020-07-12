import React from "react";
import { css } from "@emotion/core";

export default function BodyText({ content }) {
  return (
    <React.Fragment>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        css={css`
          line-height: 1.6em;
          p {
            margin: 0 0 3em;
          }
        `}
        />
    </React.Fragment>
  );
}
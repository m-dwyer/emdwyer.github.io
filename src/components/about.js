import React from "react"
import { css } from "@emotion/core"

const About = () => {
  return (
    <div
      css={css`
        min-width: 90vw;
      `}
    >
      <h1>About me</h1>
      <div
        css={css`
          display: flex;
          justify-content: space-around;
          flex-direction: row;
          flex-wrap: wrap;

          margin: 0 2em;

          section {
            flex: 1 1 50%;
            padding: 3em;
          }

          ul li {
            line-height: 2.5em;
          }
        `}
      >
        <section>
          <h2>Qualifications</h2>
          <ul>
            <li>B. Engineering (Software)</li>
            <li>PRINCE2 Foundation</li>
            <li>ITIL Foundation</li>
          </ul>
        </section>
        <section>
          <h2>Interests</h2>
          <ul>
            <li>Software Development (React, Node, JavaScript)</li>
            <li>Open Source (Linux)</li>
            <li>InfoSec</li>
            <li>Fitness</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default About

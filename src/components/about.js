import React from "react";
import { css } from "@emotion/core";

export default function About() {
  return (
    <div>
      <h1>
        About me
      </h1>
      <div css={css`
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        flex-wrap: wrap;
      `}>
        <div css={css`
          flex: 1 1 50%;
          min-width: 10rem;
        `}>
          <h2>Interests</h2>
          <ul css={css`
            list-style: none;
            padding-left: 0;
          `}>
            <li>Development (Full stack)</li>
            <li>Linux</li>
            <li>InfoSec</li>
            <li>
            Fitness
              <ul css={css`
                list-style: none;
              `}>
                <li>Cycling</li>
                <li>Strength Training</li>
                <li>Running</li>
              </ul>
            </li>
            <li>LGBTIQA+ Rights and Causes</li>
          </ul>
        </div>
        <div css={css`
          flex: 1 1 50%;
          min-width: 10rem;
        `}>
          <h2>Background</h2>
          <ul css={css`
            list-style: none;
            padding-left: 0;
            li {
              padding: 10px 0 10px 0;
            }
          `}>
            <li>B. Engineering (Software)</li>
            <li>Over a decade in various IT roles, including Development, QA Engineering, Automation and Support</li>
            <li>Experience in Ruby, C#, .NET, Bash</li>
            <li>Currently learning a new stack with HTML5, CSS3, React, Node - follow my adventures!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
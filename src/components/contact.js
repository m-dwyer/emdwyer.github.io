import React from "react"
import { css } from "@emotion/react"
import { FaGithub, FaTwitter, FaStrava } from "react-icons/fa"

const Contact = ({ contacts }) => {
  return (
    <div>
      <h1
        css={css`
          display: flex;
          justify-content: center;
        `}
      >
        Contact
      </h1>
      <div
        css={css`
          display: flex;
          justify-content: center;
          width: 100%;
        `}
      >
        {contacts["github"] && (
          <a
            href={contacts["github"]}
            className="link"
            rel="noreferrer"
            target="_blank"
          >
            <FaGithub size={60} />
          </a>
        )}
        {contacts["twitter"] && (
          <a
            href={contacts["twitter"]}
            className="link"
            rel="noreferrer"
            target="_blank"
          >
            <FaTwitter size={60} />
          </a>
        )}
        {contacts["strava"] && (
          <a
            href={contacts["strava"]}
            className="link"
            rel="noreferrer"
            target="_blank"
          >
            <FaStrava size={60} />
          </a>
        )}
      </div>
    </div>
  )
}

export default Contact

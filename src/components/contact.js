import React from "react";
import { css } from "@emotion/core";
import { FaGithub, FaTwitter, FaStrava } from "react-icons/fa";

export default function Contact(props) {
  const contacts = props.contacts;

  return (
    <div>
      <h1 css={css`
        display: flex;
        justify-content: center;
      `}>
        Contact
      </h1>
      <div css={css`
        display: flex;
        justify-content: center;
        width: 90vw;
      `}>
        {contacts['github'] &&
          <a href={contacts['github']} className="link" rel="noreferrer" target="_blank">
            <FaGithub size={60} />
          </a>
        }
        {contacts['twitter'] &&
          <a href={contacts['twitter']} className="link" rel="noreferrer" target="_blank">
            <FaTwitter size={60} />
          </a>
        }
        {contacts['strava'] &&
          <a href={contacts['strava']} className="link" rel="noreferrer" target="_blank">
            <FaStrava size={60} />
          </a>
        }
      </div>
    </div>
  );
}
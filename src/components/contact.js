import React from "react";
import { css } from "@emotion/core";
import { FaGithub, FaTwitter } from "react-icons/fa";
import { useStaticQuery, graphql, Link } from "gatsby";

export default function Contact(props) {
  const {
    site: {
      siteMetadata: {
        contact: contacts
      }
    }
  } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            contact {
              github
            }
          }
        }
      }
    `
  );

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
        {contacts['github'] && <Link to={contacts['github']} className="link" target="_blank"><FaGithub size={60} /></Link>}
        {contacts['twitter'] && <Link to={contacts['twitter']} className="link" target="_blank"><FaTwitter size={60} /></Link>}
      </div>
    </div>
  );
}
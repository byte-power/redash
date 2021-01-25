import React from "react";
import { AppDetail } from "@/components/proptypes";

export default function ReadOnlyAppDetail({ app }) {
  return (
    <div className="col-md-4 col-md-offset-4 profile__container">
      <img alt="profile" src={app.profileImageUrl} className="profile__image" width="40" />
      <h3 className="profile__h3">{app.name}</h3>
      <hr />
      <dl className="profile__dl">
        <dt>Name:</dt>
        <dd>{app.name}</dd>
        <dt>Email:</dt>
        <dd>{app.icon_url}</dd>
        <dt className="m-b-5">Groups:</dt>
        <dd>{app.description}</dd>
      </dl>
    </div>
  );
}

ReadOnlyAppDetail.propTypes = {
  app: AppDetail.isRequired,
};

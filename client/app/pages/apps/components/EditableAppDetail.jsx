import React, { useState, useEffect } from "react";
import { AppDetail } from "@/components/proptypes";

import AppInfoForm from "./AppInfoForm";
import ApiKeyForm from "./ApiKeyForm";
import ToggleUserForm from "./ToggleUserForm";

export default function EditableAppDetail(props) {
  const [app, setApp] = useState(props.app);

  useEffect(() => {
    setApp(props.app);
  }, [props.app]);

  return (
    <div className="col-md-4 col-md-offset-4">
      <img alt="Profile" src={app.profileImageUrl} className="profile__image" width="40" />
      <h3 className="profile__h3">{app.name}</h3>
      <hr />
      <AppInfoForm app={app} onChange={setApp} />
      {!app.isDisabled && (
        <React.Fragment>
          <ApiKeyForm app={app} onChange={setApp} />
        </React.Fragment>
      )}
      <hr />
      <ToggleUserForm app={app} onChange={setApp} />
    </div>
  );
}

EditableAppDetail.propTypes = {
  app: AppDetail.isRequired,
};

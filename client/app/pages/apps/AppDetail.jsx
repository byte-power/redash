import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import EmailSettingsWarning from "@/components/EmailSettingsWarning";
import DynamicComponent from "@/components/DynamicComponent";
import LoadingState from "@/components/items-list/components/LoadingState";
import wrapSettingsTab from "@/components/SettingsWrapper";

import Application from "@/services/application";
import { currentUser } from "@/services/auth";
import routes from "@/services/routes";
import useImmutableCallback from "@/lib/hooks/useImmutableCallback";

import EditableAppDetail from "./components/EditableAppDetail";
import ReadOnlyAppDetail from "./components/ReadOnlyAppDetail";

import "./settings.less";

function AppDetail({ appId, onError }) {
  const [app, setApp] = useState(null);

  const handleError = useImmutableCallback(onError);

  useEffect(() => {
    let isCancelled = false;
    Application.get({ id: appId })
      .then(app => {
        console.log(29, app);
        if (!isCancelled) {
          setApp(app);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          handleError(error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [appId, handleError]);

  const canEdit = app && currentUser.isAdmin;
  return (
    <React.Fragment>
      <EmailSettingsWarning featureName="invite emails" className="m-b-20" adminOnly />
      <div className="row">
        {!app && <LoadingState className="" />}
        {app && (
          <DynamicComponent name="AppDetail" app={app}>
            {!canEdit && <ReadOnlyAppDetail app={app} />}
            {canEdit && <EditableAppDetail app={app} />}
          </DynamicComponent>
        )}
      </div>
    </React.Fragment>
  );
}

AppDetail.propTypes = {
  appId: PropTypes.string,
  onError: PropTypes.func,
};

AppDetail.defaultProps = {
  appId: null, // defaults to `currentUser.id`
  onError: () => {},
};

const AppDetailPage = wrapSettingsTab("Apps.Detail", null, AppDetail);

routes.register(
  "Apps.ViewOrEdit",
  routeWithUserSession({
    path: "/apps/:appId",
    title: "Application",
    render: pageProps => <AppDetailPage {...pageProps} />,
  })
);
